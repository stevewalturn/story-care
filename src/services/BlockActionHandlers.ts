/**
 * Block Action Handlers Service
 *
 * Central registry of action handlers for manual execution blocks.
 * Maps block types to their corresponding handler functions.
 *
 * Phase 5 Implementation: Universal Action Execution
 */

import { getBlockDefinition } from '@/config/BlockDefinitions';
import type { ActionExecutionRequest, ActionExecutionResult } from '@/types/BuildingBlocks';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { interpolateObject } from '@/utils/TemplateInterpolation';

/**
 * Action handler function signature
 */
type ActionHandler = (request: {
  values: Record<string, any>;
  context: any;
  user: any;
  sessionId?: string;
  onProgress?: (message: string) => void;
}) => Promise<ActionExecutionResult>;

/**
 * Save Quote Action Handler
 * Saves a quote to the patient's media library
 */
async function handleSaveQuote({
  values,
  context,
  user,
  sessionId,
  onProgress,
}: {
  values: Record<string, any>;
  context: any;
  user: any;
  sessionId?: string;
  onProgress?: (message: string) => void;
}): Promise<ActionExecutionResult> {
  try {
    onProgress?.('Saving quote...');

    const response = await authenticatedFetch('/api/media-library/quotes', user, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteText: values.quote_source,
        speaker: values.speaker,
        therapeuticSignificance: values.therapeutic_significance,
        sessionId: sessionId || context.sessionId,
        patientId: context.patientId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save quote');
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        action: 'save_quote',
        quote_text: values.quote_source,
        speaker: values.speaker,
        therapeutic_significance: values.therapeutic_significance,
        saved: true,
        quote_id: data.quote?.id,
      },
    };
  } catch (error) {
    console.error('Save quote error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save quote',
    };
  }
}

/**
 * Generate Image Action Handler
 * Generates an image using AI based on the prompt template
 */
async function handleGenerateImage({
  values,
  context,
  user,
  sessionId,
  onProgress,
}: {
  values: Record<string, any>;
  context: any;
  user: any;
  sessionId?: string;
  onProgress?: (message: string) => void;
}): Promise<ActionExecutionResult> {
  try {
    onProgress?.('Generating image with AI...');

    const response = await authenticatedFetch('/api/media/generate-image', user, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: values.prompt_template,
        style: values.style || 'photorealistic',
        sessionId: sessionId || context.sessionId,
        patientId: context.patientId,
        saveToLibrary: values.save_to_library !== false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate image');
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        action: 'generate_image',
        prompt: values.prompt_template,
        style: values.style,
        image_url: data.imageUrl,
        generated: true,
        media_id: data.media?.id,
      },
    };
  } catch (error) {
    console.error('Generate image error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image',
    };
  }
}

/**
 * Generate Music Action Handler
 * Generates music/audio using AI based on the prompt
 */
async function handleGenerateMusic({
  values,
  context,
  user,
  sessionId,
  onProgress,
}: {
  values: Record<string, any>;
  context: any;
  user: any;
  sessionId?: string;
  onProgress?: (message: string) => void;
}): Promise<ActionExecutionResult> {
  try {
    onProgress?.('Generating music with AI... This may take up to 2 minutes.');

    const response = await authenticatedFetch('/api/media/generate-music', user, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: values.music_prompt,
        lyrics: values.lyrics,
        musicStyle: values.music_style,
        duration: values.duration || 30,
        sessionId: sessionId || context.sessionId,
        patientId: context.patientId,
        saveToLibrary: values.save_to_library !== false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate music');
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        action: 'generate_music',
        prompt: values.music_prompt,
        lyrics: values.lyrics,
        music_style: values.music_style,
        duration: data.duration,
        audio_url: data.audioUrl,
        generated: true,
        media_id: data.media?.id,
      },
    };
  } catch (error) {
    console.error('Generate music error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate music',
    };
  }
}

/**
 * Registry of action handlers by handler name
 */
const ACTION_HANDLER_REGISTRY: Record<string, ActionHandler> = {
  handleSaveQuote,
  handleGenerateImage,
  handleGenerateMusic,
};

/**
 * Execute a block action
 * Universal action executor that:
 * 1. Resolves template variables in values
 * 2. Finds the appropriate handler from block definition
 * 3. Executes the handler
 * 4. Returns the result
 */
export async function executeBlockAction(
  request: ActionExecutionRequest & {
    user: any;
    sessionId?: string;
    onProgress?: (message: string) => void;
  }
): Promise<ActionExecutionResult> {
  const { blockType, values, context, user, sessionId, onProgress } = request;

  // Get block definition
  const blockDef = getBlockDefinition(blockType);
  if (!blockDef) {
    return {
      success: false,
      error: `Unknown block type: ${blockType}`,
    };
  }

  // Check if block has an action handler
  if (!blockDef.actionHandler) {
    return {
      success: false,
      error: `Block type ${blockType} does not have an action handler`,
    };
  }

  // Resolve template variables in values
  const resolvedValues = interpolateObject(values, context);

  // Get the handler function
  const handler = ACTION_HANDLER_REGISTRY[blockDef.actionHandler.handlerName];
  if (!handler) {
    return {
      success: false,
      error: `Handler ${blockDef.actionHandler.handlerName} not found`,
    };
  }

  // Show confirmation if required
  if (blockDef.actionHandler.confirmationMessage) {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(blockDef.actionHandler.confirmationMessage)
      : true;

    if (!confirmed) {
      return {
        success: false,
        error: 'Action cancelled by user',
      };
    }
  }

  // Execute the handler
  try {
    const result = await handler({
      values: resolvedValues,
      context,
      user,
      sessionId,
      onProgress,
    });

    // Show success message if provided
    if (result.success && blockDef.actionHandler.successMessage && typeof window !== 'undefined') {
      // Could integrate with a toast notification system here
      console.log('✅', blockDef.actionHandler.successMessage);
    }

    return result;
  } catch (error) {
    console.error('Action execution error:', error);

    // Show error message if provided
    const errorMessage = blockDef.actionHandler.errorMessage || 'Action failed';

    return {
      success: false,
      error: error instanceof Error ? error.message : errorMessage,
    };
  }
}

/**
 * Register a custom action handler
 * Allows extending the system with custom handlers
 */
export function registerActionHandler(handlerName: string, handler: ActionHandler): void {
  ACTION_HANDLER_REGISTRY[handlerName] = handler;
}

/**
 * Get all registered action handlers
 */
export function getRegisteredHandlers(): string[] {
  return Object.keys(ACTION_HANDLER_REGISTRY);
}
