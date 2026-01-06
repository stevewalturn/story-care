/**
 * Utility for formatting transcript utterances for AI prompt context
 */

import type { Utterance } from '@/app/(auth)/sessions/[id]/transcript/types/transcript.types';

/**
 * Format time from seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format utterances into readable transcript text for AI prompts
 * @param utterances - Array of utterances from transcript
 * @param speakerId - Optional speaker ID to filter by (null/undefined = all participants)
 * @returns Formatted transcript string with timestamps and speaker names
 */
export function formatTranscriptForAI(
  utterances: Utterance[],
  speakerId?: string | null,
): string {
  // Filter utterances by speaker if specified
  const filteredUtterances = speakerId
    ? utterances.filter(u => u.speakerId === speakerId)
    : utterances;

  if (filteredUtterances.length === 0) {
    return '[No transcript content available for the selected participant]';
  }

  // Format each utterance with timestamp and speaker info
  const formattedLines = filteredUtterances.map((u) => {
    const startTime = formatTime(u.startTime);
    const speakerRole = u.speakerType === 'therapist' ? 'Therapist' : u.speakerType === 'patient' ? 'Patient' : 'Group Member';
    return `[${startTime}] **${u.speakerName}** (${speakerRole}): ${u.text}`;
  });

  return formattedLines.join('\n');
}

/**
 * Get transcript statistics for context messaging
 */
export function getTranscriptStats(
  utterances: Utterance[],
  speakerId?: string | null,
): { count: number; totalDurationSeconds: number } {
  const filtered = speakerId
    ? utterances.filter(u => u.speakerId === speakerId)
    : utterances;

  const lastUtterance = filtered[filtered.length - 1];
  const totalDuration = lastUtterance?.endTime || 0;

  return {
    count: filtered.length,
    totalDurationSeconds: totalDuration,
  };
}

/**
 * Truncate transcript if it exceeds max length
 * @param transcript - Formatted transcript string
 * @param maxLength - Maximum character length (optional, defaults based on model)
 * @param model - AI model identifier for model-aware truncation
 * @returns Truncated transcript with notice if needed
 */
export function truncateTranscript(
  transcript: string,
  maxLength?: number,
  model?: string,
): string {
  console.log('[TranscriptFormatter] Raw transcript length:', transcript.length);
  console.log('[TranscriptFormatter] Model:', model);
  console.log('[TranscriptFormatter] Explicit maxLength:', maxLength);

  // Determine max length based on model context limits
  let effectiveMaxLength: number;

  if (maxLength) {
    effectiveMaxLength = maxLength;
  } else if (model) {
    // Use model-aware truncation if model is provided
    const { getMaxTranscriptLength } = require('./ModelContextLimits');
    effectiveMaxLength = getMaxTranscriptLength(model);
  } else {
    // Fallback to conservative default if no model or maxLength provided
    effectiveMaxLength = 50000; // ~12.5K tokens - safe for most models
  }

  console.log('[TranscriptFormatter] Effective max length:', effectiveMaxLength);

  if (transcript.length <= effectiveMaxLength) {
    console.log('[TranscriptFormatter] ✅ No truncation needed');
    return transcript;
  }

  const truncated = transcript.substring(0, effectiveMaxLength);
  // Find last complete line
  const lastNewline = truncated.lastIndexOf('\n');
  const cleanTruncated = lastNewline > 0 ? truncated.substring(0, lastNewline) : truncated;

  const omittedChars = transcript.length - cleanTruncated.length;
  const omittedTokens = Math.floor(omittedChars / 4); // Approximate

  console.log('[TranscriptFormatter] ⚠️ TRUNCATED!');
  console.log('[TranscriptFormatter] Final length:', cleanTruncated.length);
  console.log('[TranscriptFormatter] Omitted:', omittedChars, 'chars (~', omittedTokens, 'tokens)');

  return `${cleanTruncated}\n\n[... transcript truncated for model context limits. ${omittedChars.toLocaleString()} characters (~${omittedTokens.toLocaleString()} tokens) omitted ...]`;
}
