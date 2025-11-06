import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generateText, type ChatMessage, type TextGenModel } from '@/libs/TextGeneration';
import { requireSessionAccess } from '@/middleware/RBACMiddleware';
import { aiChatMessages } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { aiRateLimit, checkRateLimit, getClientIP } from '@/utils/RateLimiter';

// POST /api/ai/chat - Chat with AI assistant
// HIPAA COMPLIANCE: Requires authentication, rate limiting, and audit logging
// CRITICAL: This endpoint processes PHI (session transcripts)
export async function POST(request: NextRequest) {
  try {
    // 1. RATE LIMITING: Prevent AI API abuse (20 requests per hour)
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`ai:${clientIP}`, aiRateLimit);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many AI requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    // 2. AUTHENTICATION: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 3. VALIDATE INPUT
    const body = await request.json();
    const {
      messages,
      context,
      sessionId,
      selectedText,
      selectedUtteranceIds,
      model = 'gpt-4o', // Default model
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 },
      );
    }

    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 },
      );
    }

    // 4. AUTHORIZATION: If sessionId provided, verify user has access
    if (sessionId) {
      await requireSessionAccess(request, sessionId);
    }

    // 5. PROCESS AI REQUEST
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

    // Get AI response using selected model
    const result = await generateText({
      messages: fullMessages,
      model: model as TextGenModel,
    });

    // 6. SAVE TO DATABASE: Store chat history
    if (sessionId) {
      try {
        // Get the last user message
        const lastUserMessage = messages[messages.length - 1];

        if (lastUserMessage && lastUserMessage.role === 'user') {
          // Save user message
          await db.insert(aiChatMessages).values({
            sessionId,
            therapistId: user.dbUserId,
            role: 'user',
            content: lastUserMessage.content,
            selectedText: selectedText || null,
            selectedUtteranceIds: selectedUtteranceIds || null,
            aiModel: result.model, // Track which model was used
          });
        }

        // Save assistant response
        await db.insert(aiChatMessages).values({
          sessionId,
          therapistId: user.dbUserId,
          role: 'assistant',
          content: result.message,
          aiModel: result.model, // Track which model was used
        });
      } catch (dbError) {
        console.error('Error saving chat to database:', dbError);
        // Don't fail the request if database save fails
      }
    }

    // 7. AUDIT LOG: Record AI processing of PHI
    await logPHIAccess(user.dbUserId, 'session', sessionId || 'chat', request);

    return NextResponse.json({
      message: result.message,
      model: result.model,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return handleAuthError(error);
  }
}
