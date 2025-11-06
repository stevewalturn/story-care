/**
 * Organization Code Verification API
 * Public endpoint for users to verify organization join codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyOrgCodeSchema } from '@/validations/OrganizationValidation';
import { verifyJoinCode } from '@/services/OrganizationService';

/**
 * POST /api/organizations/verify-code - Verify organization join code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = verifyOrgCodeSchema.parse(body);

    const result = await verifyJoinCode(code);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.message },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 },
    );
  }
}
