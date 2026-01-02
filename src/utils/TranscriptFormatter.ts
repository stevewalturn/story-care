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
 * @param maxLength - Maximum character length (default ~50K chars for ~12.5K words)
 * @returns Truncated transcript with notice if needed
 */
export function truncateTranscript(
  transcript: string,
  maxLength: number = 50000,
): string {
  if (transcript.length <= maxLength) {
    return transcript;
  }

  const truncated = transcript.substring(0, maxLength);
  // Find last complete line
  const lastNewline = truncated.lastIndexOf('\n');
  const cleanTruncated = lastNewline > 0 ? truncated.substring(0, lastNewline) : truncated;

  return `${cleanTruncated}\n\n[... transcript truncated for length. ${transcript.length - cleanTruncated.length} characters omitted ...]`;
}
