import type { NextRequest } from 'next/server';
import type { ChatMessage, TextGenModel } from '@/libs/TextGeneration';
import { NextResponse } from 'next/server';
import { and, desc, eq, ne, or } from 'drizzle-orm';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generateText } from '@/libs/TextGeneration';
import { requireSessionAccess } from '@/middleware/RBACMiddleware';
import { aiChatMessages, sessions } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { aiRateLimit, checkRateLimit, getClientIP } from '@/utils/RateLimiter';
import { getOrCreateSessionSummary } from '@/services/SessionSummaryService';
import {
  generateChatSummary,
  getLatestChatSummary,
  shouldGenerateChatSummary,
} from '@/services/ChatSummaryService';

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
      sessionId,
      selectedText,
      selectedUtteranceIds,
      model = 'gemini-2.5-flash', // Default model - cost-optimized with caching
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

    // 5. BUILD INTELLIGENT CONTEXT (5-Part Strategy for Prompt Caching)
    const contextParts: ChatMessage[] = [];

    // PART 1: Session Summary (CACHED - static, generated once)
    if (sessionId) {
      try {
        const sessionSummary = await getOrCreateSessionSummary(sessionId);
        contextParts.push({
          role: 'system',
          content: sessionSummary,
        });
      } catch (error) {
        console.error('Error fetching session summary:', error);
        // Continue without session summary
      }
    }

    // PART 2: Module Prompt (CACHED - static for this session)
    if (sessionId) {
      try {
        const [session] = await db
          .select()
          .from(sessions)
          .where(eq(sessions.id, sessionId))
          .limit(1);

        if (session?.moduleId) {
          const { treatmentModules } = await import('@/models/Schema');
          const [module] = await db
            .select()
            .from(treatmentModules)
            .where(eq(treatmentModules.id, session.moduleId))
            .limit(1);

          if (module) {
            const modulePrompt = `# Treatment Module: ${module.name}

**Domain:** ${module.domain}
**Therapeutic Aim:** ${module.description}

## Module-Specific Analysis Instructions:
${module.aiPromptText}

**Important:** Use these module-specific instructions to guide your analysis. Focus on the therapeutic domain and objectives outlined above.`;

            contextParts.push({
              role: 'system',
              content: modulePrompt,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching module:', error);
        // Continue without module context
      }
    }

    // PART 3: Enhanced System Prompt (CACHED - static)
    const systemPrompt = `You are an expert therapeutic assistant specialized in narrative therapy.

**Response Format - ALWAYS use markdown:**
- Use ### for section headers (e.g., ### Key Therapeutic Themes)
- Use **bold** for emphasis and important concepts
- Use bullet points (- ) or numbered lists (1. ) for clarity
- Use > blockquotes for patient quotes
- Use 1-5 for emotional intensity ratings when relevant

**Your Expertise:**
- Identify metaphors, sensory language, and symbolic imagery
- Detect emotional shifts and narrative tone changes
- Extract scene-worthy moments for visual storytelling
- Suggest visual concepts that capture therapeutic progress
- Reference specific timestamps from transcript when citing quotes
- Connect insights to module objectives when applicable

**Output Structure:**
When analyzing, provide:
1. ### Key Therapeutic Themes (2-4 themes with explanations)
2. ### Scene-Worthy Moments (specific timestamps + visual descriptions)
3. ### Patient Quotes (exact quotes with context)
4. ### Therapeutic Insights (connect to module goals if assigned)
5. ### Visual Suggestions (concrete imagery ideas)

Be empathetic, insightful, and focused on narrative therapy principles.`;

    contextParts.push({
      role: 'system',
      content: systemPrompt,
    });

    // PART 4: Chat Summary (CACHED - regenerated periodically)
    if (sessionId) {
      try {
        // Check if we should generate a new summary
        if (await shouldGenerateChatSummary(sessionId, 10)) {
          await generateChatSummary(sessionId, user.dbUserId);
        }

        const chatSummary = await getLatestChatSummary(sessionId);
        if (chatSummary) {
          contextParts.push({
            role: 'system',
            content: `# Previous Conversation Summary\n\n${chatSummary}`,
          });
        }
      } catch (error) {
        console.error('Error with chat summary:', error);
        // Continue without chat summary
      }
    }

    // PART 5: Recent Messages (DYNAMIC - not cached)
    if (sessionId) {
      try {
        const recentMessages = await db
          .select()
          .from(aiChatMessages)
          .where(
            and(
              eq(aiChatMessages.sessionId, sessionId),
              or(
                eq(aiChatMessages.role, 'user'),
                eq(aiChatMessages.role, 'assistant'),
              ),
              ne(aiChatMessages.promptType, 'conversation_summary'),
            ),
          )
          .orderBy(desc(aiChatMessages.createdAt))
          .limit(5);

        // Add recent messages in chronological order
        const chronologicalMessages = recentMessages.reverse();
        for (const msg of chronologicalMessages) {
          contextParts.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        }
      } catch (error) {
        console.error('Error fetching recent messages:', error);
        // Continue without recent messages
      }
    }

    // Combine all context parts with new messages
    const fullMessages: ChatMessage[] = [...contextParts, ...messages];

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
