/**
 * Session Summary Service
 * Generates and manages AI-powered session summaries for context caching
 */

import type { TraceMetadata } from '@/libs/LangfuseTracing';
import type { ChatMessage } from '@/libs/TextGeneration';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { generateText } from '@/libs/TextGeneration';
import { truncateTranscript } from '@/utils/TranscriptFormatter';
import {
  groupsSchema,
  sessionsSchema,
  speakersSchema,
  transcriptsSchema,
  treatmentModulesSchema,
  usersSchema,
  utterancesSchema,
} from '@/models/Schema';

/**
 * Format time from seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export type GenerateSessionSummaryOptions = {
  traceMetadata?: TraceMetadata;
};

/**
 * Generate a comprehensive session summary for AI context
 */
export async function generateSessionSummary(
  sessionId: string,
  options?: GenerateSessionSummaryOptions,
): Promise<string> {
  // Fetch session data
  const [session] = await db
    .select()
    .from(sessionsSchema)
    .where(eq(sessionsSchema.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Fetch related entities separately
  let patient = null;
  if (session.patientId) {
    const [pat] = await db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.id, session.patientId))
      .limit(1);
    patient = pat || null;
  }

  let group = null;
  if (session.groupId) {
    const [grp] = await db
      .select()
      .from(groupsSchema)
      .where(eq(groupsSchema.id, session.groupId))
      .limit(1);
    group = grp || null;
  }

  let treatmentModule = null;
  if (session.moduleId) {
    const [mod] = await db
      .select()
      .from(treatmentModulesSchema)
      .where(eq(treatmentModulesSchema.id, session.moduleId))
      .limit(1);
    treatmentModule = mod || null;
  }

  // Fetch transcript
  const transcript = await db.query.transcripts.findFirst({
    where: eq(transcriptsSchema.sessionId, sessionId),
  });

  if (!transcript) {
    throw new Error(`Transcript not found for session: ${sessionId}`);
  }

  // Fetch utterances with speaker info
  const utterances = await db
    .select({
      id: utterancesSchema.id,
      text: utterancesSchema.text,
      startTimeSeconds: utterancesSchema.startTimeSeconds,
      endTimeSeconds: utterancesSchema.endTimeSeconds,
      speakerLabel: speakersSchema.speakerLabel,
      speakerName: speakersSchema.speakerName,
      speakerType: speakersSchema.speakerType,
    })
    .from(utterancesSchema)
    .leftJoin(speakersSchema, eq(utterancesSchema.speakerId, speakersSchema.id))
    .where(eq(utterancesSchema.transcriptId, transcript.id))
    .orderBy(utterancesSchema.startTimeSeconds);

  // Build formatted transcript
  const formattedTranscript = utterances
    .map((u) => {
      const startTime = formatTime(Number.parseFloat(u.startTimeSeconds || '0'));
      const name = u.speakerName || u.speakerLabel || 'Unknown';
      const type = u.speakerType || 'unknown';
      return `[${startTime}] **${name}** (${type}): ${u.text}`;
    })
    .join('\n');

  // Truncate transcript to stay within model context limits (gpt-4o-mini: 128K tokens)
  const safeTranscript = truncateTranscript(formattedTranscript, undefined, 'gpt-4o-mini');

  // Get patient/group name
  const patientName = patient?.name || group?.name || 'Unknown';

  // Build summary structure - NO QUOTES to respect participant filtering
  const summaryPrompt = `You are creating a brief session summary for AI context. This summary provides background context only.

Extract the following from this therapy session:

1. **Session Overview** - Brief description of what was discussed
2. **Key Therapeutic Themes** (2-4 themes, no quotes)
3. **Emotional Tone** - Overall emotional atmosphere
4. **Clinical Observations** - Brief notes on progress, challenges
5. **Treatment Focus** - What the session was working toward

**IMPORTANT RULES:**
- Do NOT include any verbatim quotes from the transcript
- Do NOT include specific dialogue or utterances
- Keep it to 200-300 words maximum
- Focus on high-level themes and observations only

Format your response in markdown with clear headers and bullet points.

**Session Details:**
- Title: ${session.title}
- Date: ${session.sessionDate}
- Type: ${session.sessionType}
- Patient: ${patientName}
${treatmentModule ? `- Module: ${treatmentModule.name} (${treatmentModule.domain})` : ''}
- Duration: ${session.audioDurationSeconds ? `${Math.floor(session.audioDurationSeconds / 60)} minutes` : 'Unknown'}

**Transcript for analysis:**
${safeTranscript}`;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are an expert narrative therapist creating session summaries. Be thorough, insightful, and focused on therapeutic themes.',
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
        patientId: patient?.id,
        patientName: patient?.name || group?.name,
        tags: [
          ...(options.traceMetadata.tags || []),
          'session-summary',
          'gemini-2.5-flash-lite',
        ],
      }
    : undefined;

  // Generate summary using Gemini Flash Lite (lowest quota usage for background summaries)
  const result = await generateText({
    messages,
    model: 'gemini-2.5-flash-lite',
    temperature: 0.3, // Lower temperature for consistent summaries
    maxTokens: 500, // Brief summary without quotes (200-300 words)
    traceMetadata,
  });

  // Build final formatted summary
  const finalSummary = `# Session: ${session.title}

**Date:** ${session.sessionDate} | **Type:** ${session.sessionType} | **Patient:** ${patientName}
${treatmentModule ? `**Module:** ${treatmentModule.name} (${treatmentModule.domain})` : ''}

---

${result.message}`;

  // Store summary in database
  await db
    .update(sessionsSchema)
    .set({
      sessionSummary: finalSummary,
      sessionSummaryGeneratedAt: new Date(),
      sessionSummaryModel: result.model,
    })
    .where(eq(sessionsSchema.id, sessionId));

  return finalSummary;
}

/**
 * Get session summary, generating if it doesn't exist
 */
export async function getOrCreateSessionSummary(
  sessionId: string,
  options?: GenerateSessionSummaryOptions,
): Promise<string> {
  // Check if summary already exists
  const session = await db.query.sessions.findFirst({
    where: eq(sessionsSchema.id, sessionId),
    columns: {
      sessionSummary: true,
    },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Return existing summary if available
  if (session.sessionSummary) {
    return session.sessionSummary;
  }

  // Generate new summary
  return await generateSessionSummary(sessionId, options);
}

/**
 * Regenerate session summary (force refresh)
 */
export async function regenerateSessionSummary(
  sessionId: string,
  options?: GenerateSessionSummaryOptions,
): Promise<string> {
  return await generateSessionSummary(sessionId, options);
}
