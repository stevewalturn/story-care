import type { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess, logPHICreate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { recordingLinks, uploadedRecordings } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('hex'); // 64 character hex string
}

// GET /api/recording-links - List all recording links for authenticated therapist
export async function GET(request: NextRequest) {
  try {
    const user = await requireTherapist(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where conditions
    const whereConditions = [
      eq(recordingLinks.therapistId, user.dbUserId),
    ];

    // Filter by status if provided
    if (status && ['pending', 'recording', 'completed', 'expired', 'revoked'].includes(status)) {
      whereConditions.push(eq(recordingLinks.status, status as any));
    }

    // Fetch links
    const links = await db
      .select()
      .from(recordingLinks)
      .where(and(...whereConditions))
      .orderBy(desc(recordingLinks.createdAt));

    // Check for expired links and update their status
    const now = new Date();
    const updatedLinks = links.map((link) => {
      if (link.status !== 'completed' && link.status !== 'revoked' && link.expiresAt < now) {
        // Link has expired
        return { ...link, status: 'expired' as const };
      }
      return link;
    });

    // Fetch associated recordings for completed links
    const linksWithRecordings = await Promise.all(
      updatedLinks.map(async (link) => {
        if (link.status === 'completed') {
          const [recording] = await db
            .select({
              id: uploadedRecordings.id,
              status: uploadedRecordings.status,
              totalDurationSeconds: uploadedRecordings.totalDurationSeconds,
              createdAt: uploadedRecordings.createdAt,
            })
            .from(uploadedRecordings)
            .where(eq(uploadedRecordings.recordingLinkId, link.id))
            .limit(1);

          return { ...link, recording };
        }
        return { ...link, recording: null };
      }),
    );

    await logPHIAccess(user.dbUserId, 'recording_link', 'list', request);

    return NextResponse.json({ links: linksWithRecordings });
  } catch (error) {
    console.error('Error fetching recording links:', error);
    return handleAuthError(error);
  }
}

// POST /api/recording-links - Create a new recording link
export async function POST(request: NextRequest) {
  try {
    const user = await requireTherapist(request);

    const body = await request.json();
    const {
      sessionTitle,
      sessionDate,
      patientIds,
      notes,
      expiryDurationMinutes = 1440, // Default 24 hours
    } = body;

    // Validate expiry duration (1 hour to 7 days)
    const minExpiry = 60; // 1 hour
    const maxExpiry = 10080; // 7 days
    const validatedExpiry = Math.min(Math.max(expiryDurationMinutes, minExpiry), maxExpiry);

    // Generate token
    const token = generateToken();

    // Calculate expiration
    const expiresAt = new Date(Date.now() + validatedExpiry * 60 * 1000);

    // Create recording link
    const [link] = await db
      .insert(recordingLinks)
      .values({
        token,
        sessionTitle: sessionTitle || null,
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        patientIds: patientIds && patientIds.length > 0 ? patientIds : null,
        notes: notes || null,
        therapistId: user.dbUserId,
        organizationId: user.organizationId || '',
        status: 'pending',
        expiresAt,
        expiryDurationMinutes: validatedExpiry,
      })
      .returning();

    if (!link) {
      return NextResponse.json({ error: 'Failed to create recording link' }, { status: 500 });
    }

    await logPHICreate(user.dbUserId, 'recording_link', link.id, request, { action: 'create' });

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/record/${token}`;

    return NextResponse.json({
      linkId: link.id,
      token,
      shareUrl,
      expiresAt: link.expiresAt,
      expiryDurationMinutes: validatedExpiry,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recording link:', error);
    return handleAuthError(error);
  }
}
