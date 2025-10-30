import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { aiChatMessages } from '@/models/Schema';
import { eq } from 'drizzle-orm';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/sessions/[id]/chat - Get chat history for a session
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sessionId } = await context.params;

    // Fetch chat messages for this session
    const messages = await db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .orderBy(aiChatMessages.createdAt);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 },
    );
  }
}

// POST /api/sessions/[id]/chat - Save a chat message
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sessionId } = await context.params;
    const body = await request.json();

    const {
      role,
      content,
      selectedText,
      selectedUtteranceIds,
      generatedMediaId,
      promptType,
      therapistId,
    } = body;

    // Validate required fields
    if (!role || !content || !therapistId) {
      return NextResponse.json(
        { error: 'Missing required fields: role, content, therapistId' },
        { status: 400 },
      );
    }

    // Insert new message
    const [newMessage] = await db
      .insert(aiChatMessages)
      .values({
        sessionId,
        therapistId,
        role,
        content,
        selectedText: selectedText || null,
        selectedUtteranceIds: selectedUtteranceIds || null,
        generatedMediaId: generatedMediaId || null,
        promptType: promptType || null,
      })
      .returning();

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json(
      { error: 'Failed to save chat message' },
      { status: 500 },
    );
  }
}
