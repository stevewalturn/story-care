/**
 * Platform Metrics API Route
 * Super Admin only - get platform-wide statistics
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  handleRBACError,
  requireSuperAdmin,
} from '@/middleware/RBACMiddleware';
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
