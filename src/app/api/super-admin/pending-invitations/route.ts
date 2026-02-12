/**
 * Pending Invitations API
 * List pending user invitations awaiting super admin approval
 * HIPAA Compliant: Requires super admin authentication
 */

import type { NextRequest } from 'next/server';
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { requireSuperAdmin } from '@/middleware/RBACMiddleware';
import { organizationsSchema, users } from '@/models/Schema';
import { logAuditFromRequest } from '@/services/AuditService';
import { handleAuthError } from '@/utils/AuthHelpers';

/**
 * GET /api/super-admin/pending-invitations - List pending invitations
 *
 * Query Parameters:
 * - search: Filter by name or email (optional)
 * - role: Filter by role - 'patient' | 'therapist' (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 *
 * Access Control:
 * - Super admins only
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const roleFilter = searchParams.get('role');
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [
      eq(users.status, 'pending_approval'),
      isNull(users.deletedAt),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
        )!,
      );
    }

    if (roleFilter && (roleFilter === 'patient' || roleFilter === 'therapist')) {
      conditions.push(eq(users.role, roleFilter));
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));

    const total = totalResult?.count || 0;

    // Fetch pending invitations
    const pendingUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        organizationId: users.organizationId,
        invitedBy: users.invitedBy,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset);

    // Enrich with inviter name and organization name
    const enrichedInvitations = await Promise.all(
      pendingUsers.map(async (invitation) => {
        let inviterName: string | null = null;
        let organizationName: string | null = null;

        if (invitation.invitedBy) {
          const [inviter] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, invitation.invitedBy))
            .limit(1);
          inviterName = inviter?.name || null;
        }

        if (invitation.organizationId) {
          const [org] = await db
            .select({ name: organizationsSchema.name })
            .from(organizationsSchema)
            .where(eq(organizationsSchema.id, invitation.organizationId))
            .limit(1);
          organizationName = org?.name || null;
        }

        return {
          ...invitation,
          inviterName,
          organizationName,
        };
      }),
    );

    // Audit log
    await logAuditFromRequest(request, authUser, 'read', 'user', null, {
      action: 'list_pending_invitations',
      count: total,
    });

    return NextResponse.json({
      invitations: enrichedInvitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch pending invitations:', error);
    return handleAuthError(error);
  }
}
