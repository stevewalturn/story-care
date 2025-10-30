import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { therapeuticPrompts } from '@/models/Schema';
import { eq, like, desc, or } from 'drizzle-orm';

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
          like(therapeuticPrompts.tags, `%${search}%`)
        )
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
      { status: 500 }
    );
  }
}

// POST /api/prompts - Create prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      therapistId,
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
        { status: 400 }
      );
    }

    const [prompt] = await db
      .insert(therapeuticPrompts)
      .values({
        therapistId: therapistId || null,
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
      { status: 500 }
    );
  }
}
