/**
 * Pending Invitations Count API
 * Lightweight endpoint for sidebar badge count
 * HIPAA Compliant: Requires super admin authentication
 */

import type { NextRequest } from 'next/server';
import { and, count, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { requireSuperAdmin } from '@/middleware/RBACMiddleware';
import { users } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

/**
 * GET /api/super-admin/pending-invitations/count
 *
 * Access Control:
 * - Super admins only
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.status, 'pending_approval'),
          isNull(users.deletedAt),
        ),
      );

    return NextResponse.json({ count: result?.count || 0 });
  } catch (error) {
    console.error('Failed to fetch pending invitations count:', error);
    return handleAuthError(error);
  }
}
