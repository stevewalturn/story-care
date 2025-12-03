/**
 * Slash Commands Configuration
 *
 * Defines slash commands for the chat interface (like Notion)
 * Type "/" to trigger the command menu
 */

import type { SlashCommand } from '@/types/BuildingBlocks';

/**
 * Available slash commands for chat
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'image',
    trigger: '/image',
    label: 'Generate Image Prompt',
    icon: '🖼️',
    blockType: 'image_prompt',
    insertTemplate: 'Generate an image that depicts ',
    description: 'Create an image generation prompt',
  },
  {
    id: 'video',
    trigger: '/video',
    label: 'Create Video Concept',
    icon: '🎬',
    blockType: 'video_prompt',
    insertTemplate: 'Create a video showing ',
    description: 'Create a video concept',
  },
  {
    id: 'music',
    trigger: '/music',
    label: 'Generate Music',
    icon: '🎵',
    blockType: 'music_generation',
    insertTemplate: 'Generate music that conveys ',
    description: 'Create therapeutic music',
  },
  {
    id: 'quote',
    trigger: '/quote',
    label: 'Extract Quotes',
    icon: '💬',
    blockType: 'quote',
    insertTemplate: 'Extract meaningful quotes about ',
    description: 'Extract quotes from transcript',
  },
  {
    id: 'note',
    trigger: '/note',
    label: 'Create Therapeutic Note',
    icon: '📝',
    blockType: 'therapeutic_note',
    insertTemplate: 'Create a therapeutic note about ',
    description: 'Write a structured note',
  },
  {
    id: 'reflect',
    trigger: '/reflect',
    label: 'Reflection Questions',
    icon: '💭',
    blockType: 'reflection_question',
    insertTemplate: 'Generate reflection questions about ',
    description: 'Create patient reflection questions',
  },
  {
    id: 'scene',
    trigger: '/scene',
    label: 'Suggest Scenes',
    icon: '🎬',
    blockType: 'scene_suggestion',
    insertTemplate: 'Suggest scenes that capture ',
    description: 'Find scene-worthy moments',
  },
  {
    id: 'analyze',
    trigger: '/analyze',
    label: 'Analyze Selection',
    icon: '🎯',
    insertTemplate: 'Analyze the following for ',
    description: 'Analyze selected text',
  },
  {
    id: 'summarize',
    trigger: '/summarize',
    label: 'Summarize',
    icon: '📋',
    insertTemplate: 'Summarize the key points about ',
    description: 'Create a summary',
  },
  {
    id: 'themes',
    trigger: '/themes',
    label: 'Identify Themes',
    icon: '🏷️',
    insertTemplate: 'Identify the main therapeutic themes in ',
    description: 'Find therapeutic themes',
  },
];

/**
 * Get slash command by trigger
 */
export function getSlashCommand(trigger: string): SlashCommand | undefined {
  return SLASH_COMMANDS.find(cmd => cmd.trigger === trigger);
}

/**
 * Get slash command by ID
 */
export function getSlashCommandById(id: string): SlashCommand | undefined {
  return SLASH_COMMANDS.find(cmd => cmd.id === id);
}

/**
 * Filter slash commands by search query
 */
export function filterSlashCommands(query: string): SlashCommand[] {
  const lowerQuery = query.toLowerCase();

  return SLASH_COMMANDS.filter(
    cmd =>
      cmd.trigger.toLowerCase().includes(lowerQuery) ||
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Detect slash command in text
 * Returns the command and the position if found
 */
export function detectSlashCommand(
  text: string,
  cursorPosition: number,
): { command: SlashCommand; startPos: number; endPos: number } | null {
  // Find the last "/" before cursor
  const textBeforeCursor = text.substring(0, cursorPosition);
  const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

  if (lastSlashIndex === -1) return null;

  // Check if there's a space or beginning of string before the slash
  if (lastSlashIndex > 0) {
    const charBefore = text[lastSlashIndex - 1];
    if (charBefore !== ' ' && charBefore !== '\n') return null;
  }

  // Extract the word after slash
  const afterSlash = text.substring(lastSlashIndex);
  const match = afterSlash.match(/^\/(\w+)/);

  if (!match) return null;

  const trigger = match[0];
  const command = getSlashCommand(trigger);

  if (command) {
    return {
      command,
      startPos: lastSlashIndex,
      endPos: lastSlashIndex + trigger.length,
    };
  }

  return null;
}
