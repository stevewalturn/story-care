import type { NextRequest } from 'next/server';
import type { ChatMessage } from '@/libs/OpenAI';
import { NextResponse } from 'next/server';
import { chat } from '@/libs/OpenAI';

// POST /api/ai/chat - Chat with AI assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, sessionId: _sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 },
      );
    }

    // Add system message with therapeutic context
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an expert therapeutic assistant specialized in narrative therapy.
Your role is to help therapists analyze session transcripts and:
- Identify key therapeutic themes
- Suggest meaningful moments for patient stories
- Generate image prompts for visual narratives
- Create reflection questions
- Extract powerful quotes

Be empathetic, professional, and focused on supporting the therapeutic process.
${context ? `\n\nSession Context:\n${context}` : ''}`,
    };

    const fullMessages: ChatMessage[] = [systemMessage, ...messages];

    // Get AI response
    const response = await chat(fullMessages);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 },
    );
  }
}
