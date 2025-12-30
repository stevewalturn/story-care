import type { NextRequest } from 'next/server';
import type { ChatMessage, TextGenModel } from '@/libs/TextGeneration';
import { and, desc, eq, ne, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generateText } from '@/libs/TextGeneration';
import { requireSessionAccess } from '@/middleware/RBACMiddleware';
import { aiChatMessages, sessions } from '@/models/Schema';
import {
  generateChatSummary,
  getLatestChatSummary,
  shouldGenerateChatSummary,
} from '@/services/ChatSummaryService';
import { getOrCreateSessionSummary } from '@/services/SessionSummaryService';
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
      sessionId,
      selectedText,
      selectedUtteranceIds,
      model = 'gemini-2.5-flash', // Default model - cost-optimized with caching
      hasPromptSelected = false, // Flag: when true, skip FREE CHAT system prompt (allow JSON output)
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
    // NOTE: This system prompt is for FREE-FORM chat only.
    // When a user selects a specific prompt (like "Potential Images"), that prompt's
    // systemPrompt is combined with the user message in AIAssistantPanel.tsx.
    // In that case, hasPromptSelected=true and we SKIP this "no JSON" prompt.
    if (!hasPromptSelected) {
      const systemPrompt = `You are an expert therapeutic assistant specialized in narrative therapy.

## THIS IS FREE CHAT MODE

**CRITICAL RESPONSE FORMAT RULE:**
You are in FREE CHAT mode. You MUST ONLY respond with plain text or markdown.
- NEVER output JSON
- NEVER output { } or any JSON-like structures
- NEVER use schemaType or any JSON fields
- NO structured data formats whatsoever
- Just respond naturally in conversational text

If the user says something simple like "ok", "hello", "thanks", just respond naturally like a human would. For example:
- "ok" → "Great! Let me know if you have any questions about the session."
- "hello" → "Hello! How can I help you analyze this therapy session today?"
- "thanks" → "You're welcome! Feel free to ask anything else."

**Markdown Formatting Guidelines (for longer responses):**
- Use ### for section headers (e.g., ### Key Therapeutic Themes)
- Use **bold** for emphasis and important concepts
- Use bullet points (- ) or numbered lists (1. ) for clarity
- Use > blockquotes for patient quotes

**Your Expertise:**
- Identify metaphors, sensory language, and symbolic imagery
- Detect emotional shifts and narrative tone changes
- Extract scene-worthy moments for visual storytelling
- Suggest visual concepts that capture therapeutic progress
- Reference specific timestamps from transcript when citing quotes
- Connect insights to module objectives when applicable

**Output Structure (for analytical responses):**
When analyzing sessions, consider providing:
1. ### Key Therapeutic Themes (2-4 themes with explanations)
2. ### Patient Quotes (exact quotes with context)
3. ### Therapeutic Insights (connect to module goals if assigned)

Be empathetic, insightful, and focused on narrative therapy principles.
Remember: PLAIN TEXT ONLY. NO JSON.`;

      contextParts.push({
        role: 'system',
        content: systemPrompt,
      });
    }

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
      maxTokens: 8000, // Increased from 2000 to support larger JSON schemas
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
