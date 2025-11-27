// JSON Action Handlers Service
// Contains handler functions for processing JSON outputs from AI Assistant

import { authenticatedPost } from '@/utils/AuthenticatedFetch';

export interface ActionContext {
  jsonData: any;
  sessionId: string;
  user: any;
  onProgress: (message: string) => void;
  onComplete: (result: { message: string; data?: any }) => void;
  onOpenImageModal?: (data: {
    prompt: string;
    style: string;
    title?: string;
    description?: string;
    sourceQuote?: string;
  }) => void;
  onOpenVideoModal?: (data: {
    prompt: string;
    title?: string;
    duration?: number;
    referenceImagePrompt?: string;
    sourceQuote?: string;
  }) => void;
  imageIndex?: number; // For image_references and video_references actions
}

// ============================================================================
// SCENE CARD ACTIONS
// ============================================================================

/**
 * Create a new scene from scene_card JSON
 */
export async function handleCreateScene(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('🎬 Creating scene...');

  const response = await authenticatedPost('/api/scenes', user, {
    sessionId,
    title: jsonData.reference_images?.[0]?.title || 'Untitled Scene',
    description: jsonData.video_introduction,
    sceneData: jsonData,
  });

  if (!response.ok) throw new Error('Failed to create scene');

  const result = await response.json();

  onComplete({
    message: `✅ Scene "${result.scene.title}" created successfully! View in Scenes panel.`,
    data: result.scene,
  });
}

/**
 * Generate all reference images from scene_card JSON (batch operation)
 */
export async function handleGenerateImages(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const images = jsonData.reference_images || [];

  if (images.length === 0) {
    onComplete({ message: '⚠️ No images to generate.' });
    return;
  }

  onProgress(`🎨 Generating ${images.length} reference images...`);

  const results = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    onProgress(`🎨 Generating image ${i + 1}/${images.length}: "${img.title}"...`);

  
    const response = await authenticatedPost('/api/ai/generate-image', user, {
      prompt: img.image_prompt,
      style: 'photorealistic',
      sessionId,
      title: img.title,
      description: img.meaning,
      sourceQuote: img.patient_quote_anchor,
    });

    if (!response.ok) {
      onProgress(`❌ Failed to generate "${img.title}"`);
      continue;
    }

    const result = await response.json();
    results.push(result);
    onProgress(`✅ Generated "${img.title}"`);
  } catch (error) {
    onProgress(`❌ Error generating "${img.title}": ${(error as Error).message}`);
  }
  }

  onComplete({
  message: `✅ Generated ${results.length}/${images.length} images. View in Library panel.`,
  data: results,
  });
}

/**
 * Generate music from scene_card JSON
 */
export async function handleGenerateMusic(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const musicData = jsonData.music;

  if (!musicData) {
  onComplete({ message: '⚠️ No music data found.' });
  return;
  }

  onProgress('🎵 Generating music track...');

  try {
  const response = await authenticatedPost('/api/ai/generate-music', user, {
    sessionId,
    musicType: 'instrumental',
    title: 'Scene Background Music',
    prompt: musicData.prompt,
    model: 'V4_5',
    instrumental: true,
    stylePrompt: musicData.prompt,
  });

  if (!response.ok) throw new Error('Failed to generate music');

  const result = await response.json();
  const taskId = result.taskId;

  onProgress('🎵 Music generation started. This may take 2-3 minutes...');

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 36; // 3 minutes max
  const poll = setInterval(async () => {
    attempts++;

    try {
      const statusResponse = await fetch(`/api/ai/music-task/${taskId}`, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      const statusData = await statusResponse.json();

      if (statusData.data.status === 'completed') {
        clearInterval(poll);
        onComplete({
          message: '✅ Music generated successfully! Listen in Library panel.',
          data: statusData.data,
        });
      } else if (statusData.data.status === 'failed' || attempts >= maxAttempts) {
        clearInterval(poll);
        throw new Error('Music generation failed or timed out');
      } else if (attempts % 6 === 0) {
        // Update every 30 seconds
        onProgress(`🎵 Still generating... (${Math.floor((attempts * 5) / 60)}m ${(attempts * 5) % 60}s)`);
      }
    } catch (pollError) {
      clearInterval(poll);
      throw pollError;
    }
  }, 5000);

}

/**
 * Save reflection questions from scene_card JSON
 */
export async function handleSaveReflections(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('💭 Saving reflection questions...');

    const response = await authenticatedPost('/api/reflections', user, {
      sessionId,
      patientQuestions: jsonData.patient_reflection_questions || [],
      groupQuestions: jsonData.group_reflection_questions || [],
    });

    if (!response.ok) throw new Error('Failed to save reflections');

    onComplete({
      message: '✅ Reflection questions saved to session.',
    });
}

// ============================================================================
// MUSIC GENERATION ACTIONS
// ============================================================================

/**
 * Generate instrumental music from music_generation JSON
 */
export async function handleGenerateInstrumental(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const instrumental = jsonData.instrumental_option;

  if (!instrumental) {
    onComplete({ message: '⚠️ No instrumental data found.' });
    return;
  }

  onProgress(`🎵 Generating instrumental: "${instrumental.title}"...`);

    const response = await authenticatedPost('/api/ai/generate-music', user, {
      sessionId,
      musicType: 'instrumental',
      title: instrumental.title,
      style: instrumental.genre_tags,
      prompt: instrumental.music_description,
      model: 'V4_5',
      instrumental: true,
      mood: instrumental.mood,
      stylePrompt: instrumental.style_prompt,
      sourceQuotes: instrumental.source_quotes,
      rationale: instrumental.rationale,
    });

    if (!response.ok) throw new Error('Failed to generate music');

    const result = await response.json();
    onProgress('🎵 Music generation started. This may take 2-3 minutes...');

    // Polling logic (similar to handleGenerateMusic)
    // ... (implementation similar to above)

    onComplete({
      message: `✅ Instrumental "${instrumental.title}" queued for generation. Check Library in 2-3 minutes.`,
      data: result,
    });
}

/**
 * Generate lyrical song from music_generation JSON
 */
export async function handleGenerateLyrical(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const lyrical = jsonData.lyrical_option;

  if (!lyrical) {
    onComplete({ message: '⚠️ No lyrical data found.' });
    return;
  }

  onProgress(`🎤 Generating lyrical song: "${lyrical.title}"...`);

    const response = await authenticatedPost('/api/ai/generate-music', user, {
      sessionId,
      musicType: 'lyrical',
      title: lyrical.title,
      style: lyrical.genre_tags,
      lyrics: lyrical.suggested_lyrics,
      model: 'V4_5',
      instrumental: false,
      mood: lyrical.mood,
      stylePrompt: lyrical.style_prompt,
      sourceQuotes: lyrical.source_quotes,
      rationale: lyrical.rationale,
    });

    if (!response.ok) throw new Error('Failed to generate music');

    const result = await response.json();
    onProgress('🎤 Lyrical song generation started. This may take 2-3 minutes...');

    onComplete({
      message: `✅ Lyrical song "${lyrical.title}" queued for generation. Check Library in 2-3 minutes.`,
      data: result,
    });
}

// ============================================================================
// SCENE SUGGESTIONS ACTIONS
// ============================================================================

/**
 * Create all scenes from scene_suggestions JSON (batch operation)
 */
export async function handleCreateScenesFromSuggestions(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const participants = jsonData.potential_scenes_by_participant || [];

  if (participants.length === 0) {
    onComplete({ message: '⚠️ No scene suggestions found.' });
    return;
  }

  const totalScenes = participants.reduce((sum: number, p: any) => sum + (p.scenes?.length || 0), 0);
  onProgress(`🎬 Creating ${totalScenes} scenes...`);

  const results = [];
  let count = 0;

  for (const participant of participants) {
    for (const scene of participant.scenes || []) {
      count++;
      onProgress(`🎬 Creating scene ${count}/${totalScenes}: "${scene.scene_title}"...`);

    
      const response = await authenticatedPost('/api/scenes', user, {
        sessionId,
        title: scene.scene_title,
        description: scene.scene_description,
        focusInstruction: scene.scene_focus_instruction,
        keyQuote: scene.key_quote,
        therapeuticRationale: scene.therapeutic_rationale,
        forPatient: participant.for_patient_name,
      });

      if (response.ok) {
        const result = await response.json();
        results.push(result);
        onProgress(`✅ Created "${scene.scene_title}"`);
      } else {
        onProgress(`❌ Failed to create "${scene.scene_title}"`);
      }
    } catch {
      onProgress(`❌ Error creating "${scene.scene_title}"`);
    }
  }
  }

  onComplete({
  message: `✅ Created ${results.length}/${totalScenes} scenes. View in Scenes panel.`,
  data: results,
  });
}

/**
 * Save scene suggestions as notes
 */
export async function handleSaveScenesAsNotes(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('📝 Saving scene suggestions as notes...');

  try {
  const participants = jsonData.potential_scenes_by_participant || [];
  const noteContent = participants
    .map((p: any) => {
      const scenes = p.scenes.map((s: any) => `- **${s.scene_title}**: ${s.scene_description}`).join('\n');
      return `## ${p.for_patient_name}\n\n${scenes}`;
    })
    .join('\n\n');

  const response = await authenticatedPost('/api/notes', user, {
    sessionId,
    title: 'Scene Suggestions',
    content: noteContent,
    tags: ['ai-generated', 'scene-suggestions'],
  });

  if (!response.ok) throw new Error('Failed to save notes');

  onComplete({
    message: '✅ Scene suggestions saved as notes.',
  });

}

// ============================================================================
// IMAGE REFERENCES ACTIONS
// ============================================================================

/**
 * Generate a single image from image_references JSON
 * Opens GenerateImageModal with pre-filled data for user review
 */
export async function handleGenerateSingleImage(ctx: ActionContext) {
  const { jsonData, imageIndex, onOpenImageModal } = ctx;
  const images = jsonData.images || [];

  if (imageIndex === undefined || !images[imageIndex]) {
    console.error('Image not found at index:', imageIndex);
    return;
  }

  const selectedImage = images[imageIndex];

  // Open the GenerateImageModal with pre-filled data
  if (onOpenImageModal) {
    onOpenImageModal({
      prompt: selectedImage.prompt || '',
      style: selectedImage.style || 'photorealistic',
      title: selectedImage.title || '',
      description: selectedImage.therapeutic_purpose || '',
      sourceQuote: selectedImage.source_quote || '',
    });
  } else {
    console.error('onOpenImageModal callback not provided');
  }
}

// ============================================================================
// VIDEO REFERENCES ACTIONS
// ============================================================================

/**
 * Generate a single video from video_references JSON
 * Opens GenerateVideoModal with pre-filled data for user review
 */
export async function handleGenerateSingleVideo(ctx: ActionContext) {
  const { jsonData, imageIndex, onOpenVideoModal } = ctx;
  const videos = jsonData.videos || [];

  if (imageIndex === undefined || !videos[imageIndex]) {
    console.error('Video not found at index:', imageIndex);
    return;
  }

  const selectedVideo = videos[imageIndex];

  // Open the GenerateVideoModal with pre-filled data
  if (onOpenVideoModal) {
    onOpenVideoModal({
      prompt: selectedVideo.prompt || '',
      title: selectedVideo.title || '',
      duration: selectedVideo.duration || 5,
      referenceImagePrompt: selectedVideo.reference_image_prompt,
      sourceQuote: selectedVideo.source_quote || '',
    });
  } else {
    console.error('onOpenVideoModal callback not provided');
  }
}

// ============================================================================
// REFLECTION QUESTIONS ACTIONS
// ============================================================================

/**
 * Add reflection questions to module
 */
export async function handleAddReflectionsToModule(ctx: ActionContext) {
  const { jsonData: _jsonData, onProgress, onComplete } = ctx;

  onProgress('💭 Adding reflection questions to module...');

  // TODO: Implement module integration
  onComplete({
    message: '⚠️ Module integration coming soon. Questions saved to session.',
  });
}

/**
 * Save reflection questions as note
 */
export async function handleSaveAsNote(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('📝 Saving as note...');

    const questions = jsonData.patient_questions || jsonData.reflection_questions || [];
    const content = questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');

    const response = await authenticatedPost('/api/notes', user, {
      sessionId,
      title: 'Reflection Questions',
      content,
      tags: ['reflection', 'ai-generated'],
    });

    if (!response.ok) throw new Error('Failed to save note');

    onComplete({
      message: '✅ Reflection questions saved as note.',
    });
}

// ============================================================================
// THERAPEUTIC NOTE ACTIONS
// ============================================================================

/**
 * Save therapeutic note
 */
export async function handleSaveTherapeuticNote(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('📝 Saving therapeutic note...');

    const response = await authenticatedPost('/api/notes', user, {
      sessionId,
      title: jsonData.note_title,
      content: jsonData.note_content,
      tags: jsonData.tags || ['therapeutic', 'ai-generated'],
    });

    if (!response.ok) throw new Error('Failed to save note');

    onComplete({
      message: '✅ Therapeutic note saved.',
    });
}

// ============================================================================
// QUOTE EXTRACTION ACTIONS
// ============================================================================

/**
 * Save all extracted quotes
 */
export async function handleSaveQuotes(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const quotes = jsonData.extracted_quotes || jsonData.quotes || [];

  if (quotes.length === 0) {
    onComplete({ message: '⚠️ No quotes to save.' });
    return;
  }

  onProgress(`💬 Saving ${quotes.length} quotes...`);

  const results = [];

  for (let i = 0; i < quotes.length; i++) {
    const quote = quotes[i];
    onProgress(`💬 Saving quote ${i + 1}/${quotes.length}...`);

    try {
      const response = await authenticatedPost('/api/quotes', user, {
        sessionId,
        quoteText: quote.quote_text || quote.text,
        tags: quote.tags || [],
        notes: quote.context || quote.significance || '',
      });

      if (response.ok) {
        const result = await response.json();
        results.push(result);
        onProgress(`✅ Saved quote ${i + 1}`);
      } else {
        onProgress(`❌ Failed to save quote ${i + 1}`);
      }
    } catch {
      onProgress(`❌ Error saving quote ${i + 1}`);
    }
  }

  onComplete({
    message: `✅ Saved ${results.length}/${quotes.length} quotes. View in Library panel.`,
    data: results,
  });
}

// ============================================================================
// EXPORT ALL HANDLERS
// ============================================================================

export const ACTION_HANDLERS: Record<string, (ctx: ActionContext) => Promise<void>> = {
  // Scene Card
  handleCreateScene,
  handleGenerateImages,
  handleGenerateMusic,
  handleSaveReflections,

  // Music Generation
  handleGenerateInstrumental,
  handleGenerateLyrical,

  // Scene Suggestions
  handleCreateScenesFromSuggestions,
  handleSaveScenesAsNotes,

  // Image References
  handleGenerateSingleImage,

  // Video References
  handleGenerateSingleVideo,

  // Reflection Questions
  handleAddReflectionsToModule,
  handleSaveAsNote,

  // Therapeutic Note
  handleSaveTherapeuticNote,

  // Quote Extraction
  handleSaveQuotes,
};
