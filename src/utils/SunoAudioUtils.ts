import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { uploadFile } from '@/libs/GCS';
import { mediaLibrary, musicGenerationTasks } from '@/models/Schema';

/**
 * Download audio from Suno and save to media library
 * Reusable function for both webhook and polling endpoints
 */
export async function downloadAndSaveAudio(
  task: any,
  audioUrl: string,
  audioData: {
    title?: string;
    duration?: number;
    prompt?: string;
  },
) {
  console.log(`[Suno Audio] Downloading audio for task ${task.taskId}`);

  // 1. Download audio from Suno URL
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const buffer = Buffer.from(audioBuffer);

  // 2. Upload to GCS
  const fileName = `${task.taskId}.mp3`;
  const { path: gcsPath } = await uploadFile(buffer, fileName, {
    folder: 'music',
    contentType: 'audio/mpeg',
    makePublic: false,
  });

  console.log(`[Suno Audio] Uploaded to GCS: ${gcsPath}`);

  // 3. Build notes with generation parameters for enhanced metadata
  const isInstrumental = task.instrumental === true;
  const generationNotes = JSON.stringify({
    model: task.model,
    instrumental: isInstrumental,
    type: isInstrumental ? 'instrumental' : 'lyrical',
    duration: audioData.duration || task.duration,
    generatedAt: new Date().toISOString(),
    sunoTaskId: task.taskId,
  });

  // 4. Save to media_library (store path, not signed URL)
  const result = await db
    .insert(mediaLibrary)
    .values({
      mediaType: 'audio',
      mediaUrl: gcsPath,
      sourceType: 'generated',
      generationPrompt: audioData.prompt || task.prompt,
      aiModel: `suno-${task.model}`,
      durationSeconds: Math.round(audioData.duration || task.duration || 120),
      status: 'completed',
      patientId: task.patientId,
      sourceSessionId: task.sessionId,
      createdByTherapistId: task.createdByTherapistId,
      title: audioData.title || task.title || 'AI Generated Music',
      notes: generationNotes,
      tags: ['ai-generated', 'suno-music', isInstrumental ? 'instrumental' : 'lyrical'],
    })
    .returning();

  const media = Array.isArray(result) ? result[0] : undefined;
  if (!media) {
    throw new Error('Failed to create media record');
  }

  console.log(`[Suno Audio] Created media record: ${media.id}`);

  // 5. Update task as completed
  await db
    .update(musicGenerationTasks)
    .set({
      status: 'completed',
      progress: 100,
      mediaId: media.id,
      audioUrl,
      duration: audioData.duration ? Math.round(audioData.duration) : undefined,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(musicGenerationTasks.id, task.id));

  console.log(`[Suno Audio] Task completed: ${task.taskId}`);

  return media;
}
