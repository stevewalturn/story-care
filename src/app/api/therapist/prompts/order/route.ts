/**
 * API Route: Therapist Prompt Order
 * GET: Fetch user's custom prompt order
 * PUT: Save user's custom prompt order
 * DELETE: Reset to default order
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { userPromptOrderSchema, usersSchema } from '@/models/Schema';

// Helper to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decodedToken = await verifyIdToken(token);
  const firebaseUid = decodedToken.uid;

  const user = await db.query.usersSchema.findFirst({
    where: eq(usersSchema.firebaseUid, firebaseUid),
  });

  return user;
}

// GET: Fetch user's custom prompt order
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['therapist', 'org_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orderEntries = await db
      .select({
        promptId: userPromptOrderSchema.promptId,
        sortOrder: userPromptOrderSchema.sortOrder,
      })
      .from(userPromptOrderSchema)
      .where(eq(userPromptOrderSchema.userId, user.id))
      .orderBy(userPromptOrderSchema.sortOrder);

    return NextResponse.json({
      order: orderEntries,
      hasCustomOrder: orderEntries.length > 0,
    });
  } catch (error) {
    console.error('Error fetching prompt order:', error);
    return NextResponse.json({ error: 'Failed to fetch prompt order' }, { status: 500 });
  }
}

// PUT: Save user's custom prompt order
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['therapist', 'org_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { promptIds } = body;

    if (!Array.isArray(promptIds)) {
      return NextResponse.json(
        { error: 'promptIds must be an array' },
        { status: 400 },
      );
    }

    // Delete existing order entries for this user
    await db
      .delete(userPromptOrderSchema)
      .where(eq(userPromptOrderSchema.userId, user.id));

    // Insert new order entries
    if (promptIds.length > 0) {
      const orderEntries = promptIds.map((promptId: string, index: number) => ({
        userId: user.id,
        promptId,
        sortOrder: index,
      }));

      await db.insert(userPromptOrderSchema).values(orderEntries);
    }

    console.log(`[Prompt Order API] Saved order for user ${user.email}: ${promptIds.length} prompts`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving prompt order:', error);
    return NextResponse.json({ error: 'Failed to save prompt order' }, { status: 500 });
  }
}

// DELETE: Reset to default order
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['therapist', 'org_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete all order entries for this user
    await db
      .delete(userPromptOrderSchema)
      .where(eq(userPromptOrderSchema.userId, user.id));

    console.log(`[Prompt Order API] Reset order for user ${user.email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting prompt order:', error);
    return NextResponse.json({ error: 'Failed to reset prompt order' }, { status: 500 });
  }
}
