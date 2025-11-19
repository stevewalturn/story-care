/**
 * Session Summary Service
 * Generates and manages AI-powered session summaries for context caching
 */

import type { ChatMessage } from '@/libs/TextGeneration';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { generateText } from '@/libs/TextGeneration';
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

/**
 * Generate a comprehensive session summary for AI context
 */
export async function generateSessionSummary(sessionId: string): Promise<string> {
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

  // Get patient/group name
  const patientName = patient?.name || group?.name || 'Unknown';

  // Build summary structure
  const summaryPrompt = `You are creating a comprehensive session summary for use as AI context. This summary will be used by a therapeutic AI assistant to provide informed analysis.

Extract the following from this therapy session transcript:

1. **Key Therapeutic Themes** (2-4 themes)
2. **Significant Moments** (with timestamps)
3. **Emotional Patterns** (shifts, recurring emotions)
4. **Metaphors & Symbolic Language** used by patient
5. **Clinical Observations** (resistance, breakthroughs, narrative patterns)
6. **Narrative Therapy Opportunities** (potential for visual storytelling)

Format your response in markdown with clear headers and bullet points.
Be concise but comprehensive. Include specific quotes with timestamps when relevant.

**Session Details:**
- Title: ${session.title}
- Date: ${session.sessionDate}
- Type: ${session.sessionType}
- Patient: ${patientName}
${treatmentModule ? `- Module: ${treatmentModule.name} (${treatmentModule.domain})` : ''}
- Duration: ${session.audioDurationSeconds ? `${Math.floor(session.audioDurationSeconds / 60)} minutes` : 'Unknown'}

**Full Transcript:**
${formattedTranscript}`;

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

  // Generate summary using GPT-4o-mini (good quality, lower cost)
  const result = await generateText({
    messages,
    model: 'gpt-4o-mini',
    temperature: 0.3, // Lower temperature for consistent summaries
    maxTokens: 2000, // Allow for detailed summaries
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
export async function getOrCreateSessionSummary(sessionId: string): Promise<string> {
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
  return await generateSessionSummary(sessionId);
}

/**
 * Regenerate session summary (force refresh)
 */
export async function regenerateSessionSummary(sessionId: string): Promise<string> {
  return await generateSessionSummary(sessionId);
}
