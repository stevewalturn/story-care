/**
 * API Route: Super Admin AI Models Bulk Operations
 * PUT: Bulk update model status
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { usersSchema } from '@/models/Schema';
import { bulkUpdateModelStatus } from '@/services/AiModelService';
import { bulkUpdateStatusSchema } from '@/validations/AiModelValidation';

export async function PUT(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Verify role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = bulkUpdateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 },
      );
    }

    const { modelIds, status } = validation.data;
    const updatedModels = await bulkUpdateModelStatus(modelIds, status);

    return NextResponse.json({
      success: true,
      updatedCount: updatedModels.length,
      models: updatedModels,
    });
  } catch (error) {
    console.error('Error bulk updating AI models:', error);
    return NextResponse.json({ error: 'Failed to bulk update AI models' }, { status: 500 });
  }
}
