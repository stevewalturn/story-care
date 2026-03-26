/**
 * Chat Summary Service
 * Manages conversation summaries for AI context caching
 */

import type { TraceMetadata } from '@/libs/LangfuseTracing';
import type { ChatMessage } from '@/libs/TextGeneration';
import { and, desc, eq, gt, ne, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { generateText } from '@/libs/TextGeneration';
import { aiChatMessagesSchema } from '@/models/Schema';

export type GenerateChatSummaryOptions = {
  traceMetadata?: TraceMetadata;
};

/**
 * Check if a new conversation summary should be generated
 * @param sessionId - Session ID
 * @param threshold - Number of messages before generating summary (default: 10)
 */
export async function shouldGenerateChatSummary(
  sessionId: string,
  threshold: number = 10,
): Promise<boolean> {
  // Get the latest summary
  const latestSummary = await db.query.aiChatMessages.findFirst({
    where: and(
      eq(aiChatMessagesSchema.sessionId, sessionId),
      eq(aiChatMessagesSchema.promptType, 'conversation_summary'),
    ),
    orderBy: [desc(aiChatMessagesSchema.createdAt)],
  });

  // If no summary exists, check if we have enough messages
  if (!latestSummary) {
    const messageCount = await db
      .select({ count: aiChatMessagesSchema.id })
      .from(aiChatMessagesSchema)
      .where(
        and(
          eq(aiChatMessagesSchema.sessionId, sessionId),
          or(
            eq(aiChatMessagesSchema.role, 'user'),
            eq(aiChatMessagesSchema.role, 'assistant'),
          ),
        ),
      );

    return Number(messageCount[0]?.count || 0) >= threshold;
  }

  // Count messages created after the last summary (filter by timestamp to avoid stale counts)
  const messagesSinceLastSummary = await db
    .select({ count: aiChatMessagesSchema.id })
    .from(aiChatMessagesSchema)
    .where(
      and(
        eq(aiChatMessagesSchema.sessionId, sessionId),
        or(
          eq(aiChatMessagesSchema.role, 'user'),
          eq(aiChatMessagesSchema.role, 'assistant'),
        ),
        gt(aiChatMessagesSchema.createdAt, latestSummary.createdAt),
      ),
    );

  return Number(messagesSinceLastSummary[0]?.count || 0) >= threshold;
}

/**
 * Generate a conversation summary
 * @param sessionId - Session ID
 * @param therapistId - Therapist ID who initiated the summary
 * @param options - Optional trace metadata for observability
 */
export async function generateChatSummary(
  sessionId: string,
  therapistId: string,
  options?: GenerateChatSummaryOptions,
): Promise<string> {
  // TODO: Implement latest summary check for context continuity
  // const latestSummary = await db.query.aiChatMessages.findFirst({
  //   where: and(
  //     eq(aiChatMessagesSchema.sessionId, sessionId),
  //     eq(aiChatMessagesSchema.promptType, 'conversation_summary'),
  //   ),
  //   orderBy: [desc(aiChatMessagesSchema.createdAt)],
  // });

  // Get messages since last summary (or all messages if no summary exists)
  const messages = await db.query.aiChatMessages.findMany({
    where: and(
      eq(aiChatMessagesSchema.sessionId, sessionId),
      or(
        eq(aiChatMessagesSchema.role, 'user'),
        eq(aiChatMessagesSchema.role, 'assistant'),
      ),
      ne(aiChatMessagesSchema.promptType, 'conversation_summary'),
    ),
    orderBy: [aiChatMessagesSchema.createdAt],
  });

  if (messages.length === 0) {
    throw new Error('No messages to summarize');
  }

  // Build conversation transcript
  const conversationTranscript = messages
    .map((msg) => {
      const role = msg.role === 'user' ? 'Therapist' : 'AI Assistant';
      return `**${role}**: ${msg.content}`;
    })
    .join('\n\n');

  // Build summary prompt
  const summaryPrompt = `Summarize the following therapeutic conversation between a therapist and AI assistant.

Focus on:
1. **Key Questions Asked** by the therapist
2. **Main Insights Provided** by the AI
3. **Therapeutic Directions Explored** (e.g., specific themes, metaphors, scenes)
4. **Recurring Topics** or patterns in the conversation

Be concise (300-500 tokens). Use bullet points for clarity.

**Conversation:**

${conversationTranscript}`;

  const summaryMessages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are creating a concise summary of a therapeutic AI conversation.',
    },
    {
      role: 'user',
      content: summaryPrompt,
    },
  ];

  // Build enhanced trace metadata with session context
  const traceMetadata = options?.traceMetadata
    ? {
        ...options.traceMetadata,
        sessionId,
        tags: [
          ...(options.traceMetadata.tags || []),
          'chat-summary',
          'gpt-4o-mini',
        ],
      }
    : undefined;

  // Generate summary using GPT-4o-mini
  const result = await generateText({
    messages: summaryMessages,
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 800,
    traceMetadata,
  });

  // Get the last message ID for tracking
  const lastMessageId = messages[messages.length - 1]?.id;

  // Store summary in database
  await db.insert(aiChatMessagesSchema).values({
    sessionId,
    therapistId,
    role: 'assistant',
    content: result.message,
    promptType: 'conversation_summary',
    summaryUpToMessageId: lastMessageId,
    aiModel: result.model,
  });

  return result.message;
}

/**
 * Get the latest conversation summary
 * @param sessionId - Session ID
 */
export async function getLatestChatSummary(
  sessionId: string,
): Promise<string | null> {
  const latestSummary = await db.query.aiChatMessages.findFirst({
    where: and(
      eq(aiChatMessagesSchema.sessionId, sessionId),
      eq(aiChatMessagesSchema.promptType, 'conversation_summary'),
    ),
    orderBy: [desc(aiChatMessagesSchema.createdAt)],
  });

  return latestSummary?.content || null;
}

/**
 * Get all conversation summaries for a session (for history/debugging)
 * @param sessionId - Session ID
 */
export async function getAllChatSummaries(sessionId: string) {
  return await db.query.aiChatMessages.findMany({
    where: and(
      eq(aiChatMessagesSchema.sessionId, sessionId),
      eq(aiChatMessagesSchema.promptType, 'conversation_summary'),
    ),
    orderBy: [aiChatMessagesSchema.createdAt],
  });
}
