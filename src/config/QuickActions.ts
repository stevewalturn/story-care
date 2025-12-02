/**
 * Quick Actions Configuration
 *
 * Defines quick action buttons for the chat interface
 * These provide one-click access to common therapeutic prompts
 */

import type { QuickAction } from '@/types/BuildingBlocks';

/**
 * Available quick actions for chat
 */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'generate_image',
    label: 'Image',
    icon: '🖼️',
    blockType: 'image_prompt',
    promptTemplate:
      'Generate an image prompt based on the following context:\n\n{selected_text}\n\nCreate a therapeutic image that captures the essence of this moment.',
    description: 'Generate an image prompt from selected text',
  },
  {
    id: 'create_video',
    label: 'Video',
    icon: '🎬',
    blockType: 'video_prompt',
    promptTemplate:
      'Based on this therapeutic context:\n\n{selected_text}\n\nCreate a video concept that visualizes this narrative moment.',
    description: 'Create a video concept from the session',
  },
  {
    id: 'extract_quotes',
    label: 'Quotes',
    icon: '💬',
    blockType: 'quote',
    promptTemplate:
      'Extract meaningful therapeutic quotes from:\n\n{selected_text}\n\nFocus on moments of insight, resilience, or transformation.',
    description: 'Extract meaningful quotes',
  },
  {
    id: 'create_note',
    label: 'Note',
    icon: '📝',
    blockType: 'therapeutic_note',
    promptTemplate:
      'Create a therapeutic note about:\n\n{selected_text}\n\nInclude key themes, observations, and therapeutic insights.',
    description: 'Create a structured therapeutic note',
  },
  {
    id: 'reflection_questions',
    label: 'Reflect',
    icon: '💭',
    blockType: 'reflection_question',
    promptTemplate:
      'Generate reflection questions for the patient based on:\n\n{selected_text}\n\nCreate questions that encourage deeper exploration and insight.',
    description: 'Generate patient reflection questions',
  },
  {
    id: 'scene_suggestions',
    label: 'Scenes',
    icon: '🎬',
    blockType: 'scene_suggestion',
    promptTemplate:
      'Suggest scenes for video assembly from:\n\n{selected_text}\n\nIdentify scene-worthy moments with emotional significance.',
    description: 'Suggest scenes for video assembly',
  },
];

/**
 * Get quick action by ID
 */
export function getQuickAction(id: string): QuickAction | undefined {
  return QUICK_ACTIONS.find(action => action.id === id);
}

/**
 * Get quick actions by block type
 */
export function getQuickActionsByBlockType(blockType: string): QuickAction[] {
  return QUICK_ACTIONS.filter(action => action.blockType === blockType);
}

/**
 * Format prompt template with context
 */
export function formatPromptTemplate(
  template: string,
  context: {
    selectedText?: string;
    sessionId?: string;
    [key: string]: any;
  },
): string {
  let formatted = template;

  // Replace placeholders
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    formatted = formatted.replace(new RegExp(placeholder, 'g'), value || '');
  });

  return formatted;
}
