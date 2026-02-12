/**
 * Therapist Report Generation API
 * Generates PDF reports for therapist activity and metrics
 * HIPAA Compliant: Requires admin authentication and audit logging
 */

import type { NextRequest } from 'next/server';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { jsPDF as JsPDF } from 'jspdf';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary, sessions, storyPages, users } from '@/models/Schema';
import { logAuditFromRequest } from '@/services/AuditService';
import { handleAuthError, requireAdmin } from '@/utils/AuthHelpers';

/**
 * GET /api/therapists/[id]/report - Generate therapist report
 *
 * Query Parameters:
 * - format: 'pdf' (default) - Output format for the report
 *
 * Access Control:
 * - Org admins: Can only generate reports for therapists in their organization
 * - Super admins: Can generate reports for therapists across all organizations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // HIPAA: Require org admin or super admin
    const authUser = await requireAdmin(request);
    const { id } = await params;

    // Fetch therapist
    const therapist = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    // Ensure user is actually a therapist
    if (therapist.role !== 'therapist') {
      return NextResponse.json(
        { error: 'User is not a therapist' },
        { status: 400 },
      );
    }

    // Organization boundary enforcement
    if (authUser.role === 'org_admin') {
      if (therapist.organizationId !== authUser.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot access therapists outside your organization' },
          { status: 403 },
        );
      }
    }

    // Fetch organization details
    let organizationName = 'N/A';
    if (therapist.organizationId) {
      const organization = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.id, therapist.organizationId!),
      });
      if (organization) {
        organizationName = organization.name;
      }
    }

    // Calculate metrics
    // 1. Total patients
    const totalPatientsResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.role, 'patient'),
          eq(users.therapistId, therapist.id),
          isNull(users.deletedAt),
        ),
      );
    const totalPatients = Number(totalPatientsResult[0]?.count || 0);

    // 2. Total sessions
    const totalSessionsResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.therapistId, therapist.id));
    const totalSessions = Number(totalSessionsResult[0]?.count || 0);

    // 3. Story pages created
    const storyPagesCreatedResult = await db
      .select({ count: count() })
      .from(storyPages)
      .where(eq(storyPages.createdByTherapistId, therapist.id));
    const storyPagesCreated = Number(storyPagesCreatedResult[0]?.count || 0);

    // 4. Media generated
    const mediaGeneratedResult = await db
      .select({ count: count() })
      .from(mediaLibrary)
      .where(eq(mediaLibrary.createdByTherapistId, therapist.id));
    const mediaGenerated = Number(mediaGeneratedResult[0]?.count || 0);

    // Fetch patients with session counts
    const patientsList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'patient'),
          eq(users.therapistId, therapist.id),
          isNull(users.deletedAt),
        ),
      )
      .orderBy(desc(users.createdAt))
      .limit(20);

    // Get session count for each patient
    const patientsWithSessionCount = await Promise.all(
      patientsList.map(async (patient) => {
        const sessionCountResult = await db
          .select({ count: count() })
          .from(sessions)
          .where(
            and(
              eq(sessions.patientId, patient.id),
              eq(sessions.therapistId, therapist.id),
            ),
          );
        return {
          ...patient,
          sessionCount: Number(sessionCountResult[0]?.count || 0),
        };
      }),
    );

    // Fetch recent sessions
    const recentSessions = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        sessionDate: sessions.sessionDate,
        sessionType: sessions.sessionType,
        patientId: sessions.patientId,
      })
      .from(sessions)
      .where(eq(sessions.therapistId, therapist.id))
      .orderBy(desc(sessions.sessionDate))
      .limit(10);

    // Get patient names for sessions
    const sessionsWithPatient = await Promise.all(
      recentSessions.map(async (session) => {
        if (!session.patientId) {
          return { ...session, patientName: 'Group Session' };
        }
        const patient = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, session.patientId!),
        });
        return {
          ...session,
          patientName: patient?.name || 'Unknown Patient',
        };
      }),
    );

    // Generate PDF
    const doc = new JsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (neededSpace: number) => {
      if (yPos + neededSpace > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // Purple color
    doc.text('StoryCare', margin, yPos);
    yPos += 10;

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Therapist Activity Report', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPos);
    yPos += 15;

    // Therapist Information Section
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 40, 'F');
    yPos += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Therapist Information', margin + 5, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${therapist.name || 'N/A'}`, margin + 5, yPos);
    yPos += 5;
    doc.text(`Email: ${therapist.email || 'N/A'}`, margin + 5, yPos);
    yPos += 5;
    doc.text(`License: ${therapist.licenseNumber || 'N/A'}`, margin + 5, yPos);
    doc.text(`Specialty: ${therapist.specialty || 'N/A'}`, margin + 80, yPos);
    yPos += 5;
    doc.text(`Status: ${therapist.status || 'N/A'}`, margin + 5, yPos);
    doc.text(`Organization: ${organizationName}`, margin + 80, yPos);
    yPos += 15;

    // Activity Metrics Section
    checkPageBreak(50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Activity Metrics', margin, yPos);
    yPos += 8;

    // Metrics table
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 8, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Metric', margin + 5, yPos + 5);
    doc.text('Count', margin + 120, yPos + 5);
    yPos += 10;

    const metrics = [
      { label: 'Total Patients', value: totalPatients.toString() },
      { label: 'Total Sessions', value: totalSessions.toString() },
      { label: 'Story Pages Created', value: storyPagesCreated.toString() },
      { label: 'Media Generated', value: mediaGenerated.toString() },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    metrics.forEach((metric) => {
      doc.text(metric.label, margin + 5, yPos + 5);
      doc.text(metric.value, margin + 120, yPos + 5);
      yPos += 8;
    });
    yPos += 10;

    // Patient List Section
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient List', margin, yPos);
    yPos += 8;

    if (patientsWithSessionCount.length > 0) {
      // Table header
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos, contentWidth, 8, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('Name', margin + 5, yPos + 5);
      doc.text('Status', margin + 70, yPos + 5);
      doc.text('Sessions', margin + 110, yPos + 5);
      doc.text('Added', margin + 145, yPos + 5);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      patientsWithSessionCount.forEach((patient) => {
        checkPageBreak(10);
        const name = (patient.name || 'N/A').substring(0, 30);
        doc.text(name, margin + 5, yPos + 5);
        doc.text(patient.status || 'N/A', margin + 70, yPos + 5);
        doc.text(patient.sessionCount.toString(), margin + 110, yPos + 5);
        doc.text(
          patient.createdAt
            ? new Date(patient.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A',
          margin + 145,
          yPos + 5,
        );
        yPos += 8;
      });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('No patients assigned to this therapist.', margin + 5, yPos + 5);
      yPos += 10;
    }
    yPos += 10;

    // Recent Sessions Section
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Recent Sessions', margin, yPos);
    yPos += 8;

    if (sessionsWithPatient.length > 0) {
      // Table header
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos, contentWidth, 8, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('Title', margin + 5, yPos + 5);
      doc.text('Patient', margin + 70, yPos + 5);
      doc.text('Type', margin + 120, yPos + 5);
      doc.text('Date', margin + 150, yPos + 5);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      sessionsWithPatient.forEach((session) => {
        checkPageBreak(10);
        const title = (session.title || 'Untitled').substring(0, 28);
        const patientName = (session.patientName || 'N/A').substring(0, 20);
        doc.text(title, margin + 5, yPos + 5);
        doc.text(patientName, margin + 70, yPos + 5);
        doc.text(session.sessionType || 'N/A', margin + 120, yPos + 5);
        doc.text(
          session.sessionDate
            ? new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A',
          margin + 150,
          yPos + 5,
        );
        yPos += 8;
      });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('No sessions found for this therapist.', margin + 5, yPos + 5);
    }

    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `StoryCare - Confidential | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' },
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Generate filename
    const therapistName = (therapist.name || 'unknown').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `therapist-report-${therapistName}-${dateStr}.pdf`;

    // HIPAA: Audit log the report generation
    await logAuditFromRequest(request, authUser, 'export', 'user', id, {
      reportType: 'therapist_activity',
      format: 'pdf',
      therapistEmail: therapist.email,
      therapistName: therapist.name,
    });

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to generate therapist report:', error);
    return handleAuthError(error);
  }
}
