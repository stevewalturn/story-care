import type { NextRequest } from 'next/server';
import { desc, eq, like, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { therapeuticPrompts, users } from '@/models/Schema';

// GET /api/prompts - List prompts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let query = db.select().from(therapeuticPrompts);

    const filters = [];
    if (category && category !== 'all') {
      filters.push(eq(therapeuticPrompts.category, category));
    }
    if (search) {
      filters.push(
        or(
          like(therapeuticPrompts.title, `%${search}%`),
          like(therapeuticPrompts.description, `%${search}%`),
          like(therapeuticPrompts.tags, `%${search}%`),
        ),
      );
    }

    if (filters.length > 0) {
      query = query.where(or(...filters)) as any;
    }

    const prompts = await query.orderBy(desc(therapeuticPrompts.createdAt));

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 },
    );
  }
}

// POST /api/prompts - Create prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      therapistId: therapistFirebaseUid,
      title,
      description,
      promptText,
      category,
      tags,
      isFavorite,
    } = body;

    if (!title || !promptText || !category) {
      return NextResponse.json(
        { error: 'title, promptText, and category are required' },
        { status: 400 },
      );
    }

    // Convert Firebase UID to database UUID if provided
    let therapistDbId = null;
    if (therapistFirebaseUid) {
      const [therapist] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      if (therapist) {
        therapistDbId = therapist.id;
      }
      // Note: We don't return 404 here since therapistId is optional
    }

    const [prompt] = await db
      .insert(therapeuticPrompts)
      .values({
        createdBy: therapistDbId || '', // Use createdBy instead of therapistId
        title,
        description: description || null,
        promptText,
        category,
        tags: tags || null,
        isFavorite: isFavorite || false,
      })
      .returning();

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 },
    );
  }
}
