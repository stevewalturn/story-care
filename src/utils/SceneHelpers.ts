import type { SceneCardData } from '@/components/scenes-generation/SceneCard';

/**
 * Transform therapeutic scene card JSON from AI chat to SceneCardData array
 * @param sceneCard The therapeutic_scene_card JSON object from AI assistant
 * @returns Array of SceneCardData ready for the scene generation modal
 */
export function transformSceneCardToScenes(sceneCard: any): SceneCardData[] {
  if (!sceneCard?.scenes || !Array.isArray(sceneCard.scenes)) {
    return [];
  }

  return sceneCard.scenes.map((scene: any, index: number) => {
    const patientQuote = scene.sections?.patientQuote?.content || '';
    const meaning = scene.sections?.meaning?.content || '';
    const imagePrompt = scene.sections?.imagePrompt?.content || '';
    const imageToScene = scene.sections?.imageToScene?.content || '';

    // Use patient quote as title (first 50 chars) or fallback to scene number
    const title = patientQuote
      ? patientQuote.substring(0, 50).trim() + (patientQuote.length > 50 ? '...' : '')
      : `Scene ${index + 1}`;

    return {
      id: `scene-${Date.now()}-${index}`,
      sequence: scene.sceneNumber || index + 1,
      title,
      prompt: imagePrompt,
      status: 'draft' as const,
      metadata: {
        patientQuote,
        meaning,
        imageToScene,
      },
    };
  });
}

/**
 * Validate that scenes have the required media for compilation
 * @param scenes Array of scene card data
 * @returns Validation result with error message if invalid
 */
export function validateScenesForCompilation(scenes: SceneCardData[]): {
  valid: boolean;
  error?: string;
  scenesWithMedia: SceneCardData[];
} {
  if (scenes.length === 0) {
    return {
      valid: false,
      error: 'Add at least one scene to compile',
      scenesWithMedia: [],
    };
  }

  const scenesWithMedia = scenes.filter(s => s.videoMediaId || s.imageMediaId);

  if (scenesWithMedia.length === 0) {
    return {
      valid: false,
      error: 'Generate images or videos for your scenes first',
      scenesWithMedia: [],
    };
  }

  return {
    valid: true,
    scenesWithMedia,
  };
}

/**
 * Generate a title for the compiled scene based on scene content
 * @param scenes Array of scene card data
 * @param patientName Name of the patient
 * @returns Generated title string
 */
export function generateSceneTitle(scenes: SceneCardData[], patientName: string): string {
  if (scenes.length === 0) {
    return `${patientName}'s Story`;
  }

  // Try to use the first scene's patient quote for the title
  const firstQuote = scenes[0]?.metadata?.patientQuote;
  if (firstQuote) {
    const titleFromQuote = firstQuote.substring(0, 40).trim();
    return titleFromQuote + (firstQuote.length > 40 ? '...' : '');
  }

  // Fallback to generic title
  return `${patientName}'s Therapeutic Scene`;
}

/**
 * Generate a description for the compiled scene
 * @param scenes Array of scene card data
 * @returns Generated description string
 */
export function generateSceneDescription(scenes: SceneCardData[]): string {
  const sceneCount = scenes.length;
  const descriptions = scenes
    .map(s => s.metadata?.meaning)
    .filter(Boolean)
    .slice(0, 3); // Use first 3 scene meanings

  if (descriptions.length === 0) {
    return `A therapeutic scene compilation with ${sceneCount} scene${sceneCount !== 1 ? 's' : ''}.`;
  }

  return descriptions.join(' ');
}
