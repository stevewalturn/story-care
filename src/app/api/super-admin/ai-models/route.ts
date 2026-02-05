/**
 * API Route: Super Admin AI Models
 * GET: List all AI models with optional filtering
 * POST: Create new AI model
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { usersSchema } from '@/models/Schema';
import {
  createAiModel,
  getModelCountsByCategory,
  getUniqueProviders,
  listAiModels,
} from '@/services/AiModelService';
import { createAiModelSchema, listModelsQuerySchema } from '@/validations/AiModelValidation';

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = listModelsQuerySchema.safeParse({
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      provider: searchParams.get('provider') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    if (!queryParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryParams.error.issues },
        { status: 400 },
      );
    }

    // Fetch models
    const models = await listAiModels(queryParams.data);

    // Also fetch counts and providers for the UI
    const counts = await getModelCountsByCategory();
    const providers = await getUniqueProviders();

    return NextResponse.json({
      models,
      counts,
      providers,
      total: models.length,
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json({ error: 'Failed to fetch AI models' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const validation = createAiModelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 },
      );
    }

    const model = await createAiModel(validation.data);

    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    console.error('Error creating AI model:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'A model with this ID already exists' },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: 'Failed to create AI model' }, { status: 500 });
  }
}
