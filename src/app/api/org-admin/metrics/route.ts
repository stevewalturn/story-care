/**
 * Org Admin Metrics API
 * Get organization dashboard metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgAdmin, handleRBACError } from '@/middleware/RBACMiddleware';
import { getOrgMetrics } from '@/services/OrgAdminService';

/**
 * GET /api/org-admin/metrics - Get organization metrics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAdmin(request);

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID not found' },
        { status: 400 },
      );
    }

    const metrics = await getOrgMetrics(user.organizationId);

    return NextResponse.json({ metrics });
  } catch (error) {
    return handleRBACError(error);
  }
}
