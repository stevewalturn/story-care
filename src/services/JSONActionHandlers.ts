// JSON Action Handlers Service
// Contains handler functions for processing JSON outputs from AI Assistant

import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';

export type ActionContext = {
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
  onOpenMusicModal?: (data: {
    instrumentalOption?: any;
    lyricalOption?: any;
  }) => void;
  onOpenModuleSelector?: (options: {
    onModuleSelected: (moduleId: string) => void;
  }) => void;
  onOpenSaveNoteModal?: (data: {
    title: string;
    content: string;
    tags?: string[];
  }) => void;
  patientId?: string; // Patient ID for saving quotes/notes
  imageIndex?: number; // For image_references and video_references actions
};

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

    try {
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
  } catch (error) {
    onComplete({
      message: `❌ Music generation failed: ${(error as Error).message}`,
    });
  }
}

/**
 * Save reflection questions from scene_card JSON
 */
export async function handleSaveReflections(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('💭 Saving reflection questions...');

  try {
    const response = await authenticatedPost('/api/reflections', user, {
      sessionId,
      patientQuestions: jsonData.patient_reflection_questions || [],
      groupQuestions: jsonData.group_reflection_questions || [],
    });

    if (!response.ok) throw new Error('Failed to save reflections');

    onComplete({
      message: '✅ Reflection questions saved to session.',
    });
  } catch (error) {
    onComplete({
      message: `❌ Failed to save reflections: ${(error as Error).message}`,
    });
  }
}

// ============================================================================
// MUSIC GENERATION ACTIONS
// ============================================================================

/**
 * Generate instrumental music from music_generation JSON
 * Opens GenerateMusicModal with pre-filled instrumental data for user review
 */
export async function handleGenerateInstrumental(ctx: ActionContext) {
  const { jsonData, onOpenMusicModal } = ctx;

  // ✅ More descriptive error logging
  if (!jsonData) {
    console.error('[Music Generation] No JSON data provided to handler');
    return;
  }

  if (!jsonData.instrumental_option) {
    console.error('[Music Generation] No instrumental_option found in JSON:', {
      schemaType: jsonData.schemaType,
      hasLyricalOption: !!jsonData.lyrical_option,
      jsonKeys: Object.keys(jsonData),
    });
    return;
  }

  const instrumental = jsonData.instrumental_option;

  // Open the GenerateMusicModal with pre-filled instrumental data
  if (onOpenMusicModal) {
    onOpenMusicModal({
      instrumentalOption: instrumental,
      lyricalOption: undefined,
    });
  } else {
    console.error('[Music Generation] onOpenMusicModal callback not provided');
  }
}

/**
 * Generate lyrical song from music_generation JSON
 * Opens GenerateMusicModal with pre-filled lyrical data for user review
 */
export async function handleGenerateLyrical(ctx: ActionContext) {
  const { jsonData, onOpenMusicModal } = ctx;

  // ✅ More descriptive error logging
  if (!jsonData) {
    console.error('[Music Generation] No JSON data provided to handler');
    return;
  }

  if (!jsonData.lyrical_option) {
    console.error('[Music Generation] No lyrical_option found in JSON:', {
      schemaType: jsonData.schemaType,
      hasInstrumentalOption: !!jsonData.instrumental_option,
      jsonKeys: Object.keys(jsonData),
    });
    return;
  }

  const lyrical = jsonData.lyrical_option;

  // Open the GenerateMusicModal with pre-filled lyrical data
  if (onOpenMusicModal) {
    onOpenMusicModal({
      instrumentalOption: undefined,
      lyricalOption: lyrical,
    });
  } else {
    console.error('[Music Generation] onOpenMusicModal callback not provided');
  }
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

      try {
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
  } catch (error) {
    onComplete({
      message: `❌ Failed to save notes: ${(error as Error).message}`,
    });
  }
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
 * Save reflection questions to template library
 */
export async function handleSaveToTemplateLibrary(ctx: ActionContext) {
  const { jsonData, user, onProgress, onComplete } = ctx;

  onProgress('💾 Saving to template library...');

  try {
    // Helper to extract question text from string or object
    const extractQuestionText = (q: any): string | null => {
      if (typeof q === 'string') return q;
      if (q && typeof q === 'object' && q.question) return q.question;
      return null;
    };

    // Support multiple JSON formats from AI:
    // 1. questions: [{ question, rationale?, placement? }] or string[]
    // 2. patient_questions: string[] or object[]
    // 3. reflection_questions: string[] or object[]
    // 4. group_questions: string[] or object[]
    const questionsArray = jsonData.questions || [];
    const patientQuestionsRaw = jsonData.patient_questions || jsonData.reflection_questions || [];
    const groupQuestionsRaw = jsonData.group_questions || [];

    // Normalize ALL arrays (handle both object and string formats)
    const normalizedQuestions = questionsArray.map(extractQuestionText).filter(Boolean) as string[];
    const normalizedPatientQuestions = patientQuestionsRaw.map(extractQuestionText).filter(Boolean) as string[];
    const normalizedGroupQuestions = groupQuestionsRaw.map(extractQuestionText).filter(Boolean) as string[];

    // Combine all questions into template format (using standard field names)
    const allQuestions = [
      ...normalizedQuestions.map((q: string, index: number) => ({
        id: crypto.randomUUID(),
        questionText: q,
        questionType: 'open_text' as const,
        required: false,
        order: index,
      })),
      ...normalizedPatientQuestions.map((q: string, index: number) => ({
        id: crypto.randomUUID(),
        questionText: q,
        questionType: 'open_text' as const,
        required: false,
        order: normalizedQuestions.length + index,
      })),
      ...normalizedGroupQuestions.map((q: string, index: number) => ({
        id: crypto.randomUUID(),
        questionText: `[Group] ${q}`,
        questionType: 'open_text' as const,
        required: false,
        order: normalizedQuestions.length + normalizedPatientQuestions.length + index,
      })),
    ];

    if (allQuestions.length === 0) {
      onComplete({ message: '⚠️ No questions found to save.' });
      return;
    }

    // Auto-generate title from context or timestamp
    const defaultTitle = jsonData.context
      ? `Reflections: ${jsonData.context.substring(0, 50)}${jsonData.context.length > 50 ? '...' : ''}`
      : `Reflection Questions (${new Date().toLocaleDateString()})`;

    // Save to template library
    const response = await authenticatedPost('/api/templates/reflections', user, {
      title: defaultTitle,
      description: jsonData.context || 'AI-generated reflection questions',
      category: 'custom',
      scope: 'private',
      questions: allQuestions,
      metadata: {
        source: 'ai_assistant',
        generatedAt: new Date().toISOString(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save template');
    }

    const result = await response.json();

    onComplete({
      message: `✅ Template "${result.template.title}" saved! View in Templates page.`,
      data: result.template,
    });
  } catch (error) {
    onComplete({
      message: `❌ Failed to save: ${(error as Error).message}`,
    });
  }
}

/**
 * Add reflection questions to module
 */
export async function handleAddReflectionsToModule(ctx: ActionContext) {
  const { sessionId, user, onProgress, onComplete, onOpenModuleSelector } = ctx;

  onProgress('💭 Adding reflection questions to module...');

  try {
    // Check if module selector callback is available
    if (!onOpenModuleSelector) {
      onComplete({
        message: '⚠️ Module selection not available. Please try again.',
      });
      return;
    }

    // Fetch session info
    const sessionResponse = await authenticatedFetch(`/api/sessions/${sessionId}`, user);

    if (!sessionResponse.ok) {
      throw new Error('Failed to fetch session details');
    }

    const { session: _session } = await sessionResponse.json();

    // Open module selector and wait for user selection
    let selectedModuleId: string | null = null;

    await new Promise<void>((resolve, reject) => {
      onOpenModuleSelector({
        onModuleSelected: (moduleId: string) => {
          selectedModuleId = moduleId;
          resolve();
        },
      });

      // Timeout after 5 minutes
      setTimeout(() => reject(new Error('Module selection timed out')), 300000);
    });

    // Check if user selected a module
    if (!selectedModuleId) {
      onComplete({
        message: '⚠️ No module selected.',
      });
      return;
    }

    // Assign module to session
    onProgress('💭 Assigning module to session...');

    const assignResponse = await authenticatedPost(
      `/api/sessions/${sessionId}/assign-module`,
      user,
      {
        moduleId: selectedModuleId,
        notes: 'Reflection questions to be incorporated in module analysis',
      },
    );

    if (!assignResponse.ok) {
      const errorData = await assignResponse.json();
      throw new Error(errorData.error || 'Failed to assign module');
    }

    onComplete({
      message: '✅ Module assigned to session. Questions will be incorporated in analysis.',
    });
  }
  catch (error) {
    onComplete({
      message: `❌ Failed to add to module: ${(error as Error).message}`,
    });
  }
}

/**
 * Save reflection questions as note
 */
export async function handleSaveAsNote(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('📝 Saving as note...');

  try {
    // Fetch session to get patientId
    const sessionResponse = await authenticatedFetch(`/api/sessions/${sessionId}`, user);

    if (!sessionResponse.ok) {
      throw new Error('Failed to fetch session details');
    }

    const { session } = await sessionResponse.json();

    // Handle group sessions (no patientId)
    if (!session.patientId) {
      onComplete({
        message: '⚠️ Cannot save notes for group sessions. Use "Save to Template Library" instead.',
      });
      return;
    }

    const questions = jsonData.patient_questions || jsonData.reflection_questions || [];
    const content = questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');

    const response = await authenticatedPost('/api/notes', user, {
      patientId: session.patientId, // NOW INCLUDED
      sessionId,
      title: 'Reflection Questions',
      content,
      tags: ['reflection', 'ai-generated'],
    });

    if (!response.ok) throw new Error('Failed to save note');

    onComplete({
      message: '✅ Reflection questions saved as note.',
    });
  } catch (error) {
    onComplete({
      message: `❌ Failed to save note: ${(error as Error).message}`,
    });
  }
}

// ============================================================================
// THERAPEUTIC NOTE ACTIONS
// ============================================================================

/**
 * Save therapeutic note - Opens modal for patient selection
 */
export async function handleSaveTherapeuticNote(ctx: ActionContext) {
  const { jsonData, onOpenSaveNoteModal, onComplete } = ctx;

  if (!onOpenSaveNoteModal) {
    onComplete({ message: '❌ Save note modal is not available' });
    return;
  }

  // Open the modal with pre-filled content
  onOpenSaveNoteModal({
    title: jsonData.note_title || 'Therapeutic Note',
    content: jsonData.note_content || '',
    tags: jsonData.tags || ['therapeutic', 'ai-generated'],
  });

  onComplete({ message: '✅ Opening save note modal...' });
}

// ============================================================================
// QUOTE EXTRACTION ACTIONS
// ============================================================================

/**
 * Save all extracted quotes
 */
export async function handleSaveQuotes(ctx: ActionContext) {
  const { jsonData, sessionId, user, patientId, onProgress, onComplete } = ctx;
  const quotes = jsonData.extracted_quotes || jsonData.quotes || [];

  if (quotes.length === 0) {
    onComplete({ message: '⚠️ No quotes to save.' });
    return;
  }

  // Get patientId from context or fetch from session
  let resolvedPatientId = patientId;

  if (!resolvedPatientId) {
    try {
      onProgress('📋 Getting session information...');
      const sessionResponse = await authenticatedFetch(`/api/sessions/${sessionId}`, user);
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        resolvedPatientId = sessionData.session?.patient?.id || sessionData.session?.patientId;
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  }

  if (!resolvedPatientId) {
    onComplete({
      message: '❌ Cannot save quotes: No patient associated with this session. Please assign a patient to the session first.',
    });
    return;
  }

  onProgress(`💬 Saving ${quotes.length} quotes...`);

  const results = [];

  for (let i = 0; i < quotes.length; i++) {
    const quote = quotes[i];
    onProgress(`💬 Saving quote ${i + 1}/${quotes.length}...`);

    try {
      const response = await authenticatedPost('/api/quotes', user, {
        patientId: resolvedPatientId,
        sessionId,
        quoteText: quote.quote_text || quote.text,
        speaker: quote.speaker || 'Unknown',
        tags: quote.tags || [],
        notes: quote.context || quote.significance || '',
      });

      if (response.ok) {
        const result = await response.json();
        results.push(result);
        onProgress(`✅ Saved quote ${i + 1}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Failed to save quote ${i + 1}:`, errorData);
        onProgress(`❌ Failed to save quote ${i + 1}`);
      }
    } catch (error) {
      console.error(`Error saving quote ${i + 1}:`, error);
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
  handleSaveToTemplateLibrary,
  handleAddReflectionsToModule,
  handleSaveAsNote,

  // Therapeutic Note
  handleSaveTherapeuticNote,

  // Quote Extraction
  handleSaveQuotes,
};
