/**
 * API Route: Public Models API
 * GET: Get available models for a category (active only)
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { usersSchema } from '@/models/Schema';
import { getModelsForCategory, listAiModels } from '@/services/AiModelService';
import { modelCategorySchema } from '@/validations/AiModelValidation';

export async function GET(request: NextRequest) {
  try {
    // Get auth token (required for authenticated users)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Verify user exists
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');

    // If category specified, return grouped models for that category
    if (categoryParam) {
      const categoryValidation = modelCategorySchema.safeParse(categoryParam);
      if (!categoryValidation.success) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 },
        );
      }

      const groupedModels = await getModelsForCategory(categoryValidation.data);

      return NextResponse.json({
        category: categoryValidation.data,
        models: groupedModels,
      });
    }

    // Otherwise return all active models
    const models = await listAiModels({ status: 'active' });

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
