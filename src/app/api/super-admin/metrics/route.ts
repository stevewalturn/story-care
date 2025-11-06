/**
 * Super Admin Platform Metrics API
 * Get platform-wide statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, handleRBACError } from '@/middleware/RBACMiddleware';
import { getPlatformMetrics } from '@/services/OrganizationService';

/**
 * GET /api/super-admin/metrics - Get platform-wide metrics
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const metrics = await getPlatformMetrics();

    return NextResponse.json({ metrics });
  } catch (error) {
    return handleRBACError(error);
  }
}
