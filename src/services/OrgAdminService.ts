/**
 * Org Admin Service
 * Business logic for org admin dashboard and management
 */

import { eq, and, count, gte } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users, sessions } from '@/models/Schema';

/**
 * Get organization dashboard metrics
 */
export async function getOrgMetrics(organizationId: string) {
  // Count active therapists
  const therapistResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'therapist'),
        eq(users.status, 'active'),
      ),
    );
  const activeTherapists = Number(therapistResult[0]?.count || 0);

  // Count active patients
  const patientResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'patient'),
        eq(users.status, 'active'),
      ),
    );
  const activePatients = Number(patientResult[0]?.count || 0);

  // Count sessions in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const therapists = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'therapist'),
      ),
    );

  const therapistIds = therapists.map((t) => t.id);

  let sessionsLast30Days = 0;
  if (therapistIds.length > 0) {
    const sessionCounts = await Promise.all(
      therapistIds.map(async (therapistId) => {
        const result = await db
          .select({ count: count() })
          .from(sessions)
          .where(
            and(
              eq(sessions.therapistId, therapistId),
              gte(sessions.createdAt, thirtyDaysAgo),
            ),
          );
        return Number(result[0]?.count || 0);
      }),
    );
    sessionsLast30Days = sessionCounts.reduce((sum: number, count: number) => sum + count, 0);
  }

  // Count pending template approvals (TODO: when template system is implemented)
  const pendingTemplateApprovals = 0;

  return {
    activeTherapists,
    activePatients,
    sessionsLast30Days,
    pendingTemplateApprovals,
  };
}
