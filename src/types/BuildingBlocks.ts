/**
 * Building Blocks Type Definitions
 *
 * This file defines the TypeScript interfaces for the building blocks system
 * that allows therapists to create AI prompts using form-based components.
 */

/**
 * Available block types in the system
 */
export type BlockType =
  | 'image_prompt'
  | 'video_prompt'
  | 'music_generation'
  | 'video_introduction'
  | 'quote'
  | 'therapeutic_note'
  | 'scene_suggestion'
  | 'reflection_question'
  | 'survey_question'
  | 'scene_assembly'
  | 'array_container';

/**
 * Block categories for organization in the palette
 */
export type BlockCategory = 'media' | 'content' | 'structure' | 'interaction';

/**
 * Field types supported in block forms
 */
export type BlockFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'number'
  | 'boolean'
  | 'array';

/**
 * Validation rules for block fields
 */
export interface BlockFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

/**
 * Option for select-type fields
 */
export interface BlockFieldOption {
  label: string;
  value: string;
}

/**
 * Definition of a form field within a block
 */
export interface BlockField {
  id: string;
  label: string;
  type: BlockFieldType;
  placeholder?: string;
  required: boolean;
  defaultValue?: any;
  options?: BlockFieldOption[];
  validation?: BlockFieldValidation;
  helpText?: string;
}

/**
 * Complete definition of a building block type
 */
export interface BuildingBlock {
  id: string;
  type: BlockType;
  label: string;
  icon: string;
  category: BlockCategory;
  description: string;
  fields: BlockField[];
  outputSchema: object;
}

/**
 * Instance of a block with user-configured values
 */
export interface BlockInstance {
  blockId: BlockType;
  instanceId: string;
  values: Record<string, any>;
  order: number;
}

/**
 * Prompt with building blocks support
 */
export interface PromptWithBlocks {
  // Existing prompt fields
  id?: string;
  name: string;
  promptText: string;
  description?: string;
  category: string;
  icon: string;
  outputType: 'text' | 'json';

  // New building blocks fields
  blocks?: BlockInstance[];
  jsonSchema?: object;
  useAdvancedMode?: boolean;

  // Additional fields
  scope?: 'system' | 'organization' | 'private';
  organizationId?: string;
  createdBy?: string;
  useCount?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Validation rule for block combinations
 */
export interface ValidationRule {
  blockType: BlockType;
  min?: number;
  max?: number;
  requiredWith?: BlockType[];
  conflictsWith?: BlockType[];
  customValidator?: (blocks: BlockInstance[]) => { valid: boolean; message?: string };
}

/**
 * Result of block validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  blockInstanceId?: string;
  blockType?: BlockType;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Quick action configuration for chat integration
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  blockType?: BlockType;
  promptTemplate?: string;
  description?: string;
}

/**
 * Slash command configuration for chat integration
 */
export interface SlashCommand {
  id: string;
  trigger: string;
  label: string;
  icon: string;
  blockType?: BlockType;
  insertTemplate: string;
  description?: string;
}

/**
 * Block template for common combinations
 */
export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  blocks: Omit<BlockInstance, 'instanceId' | 'order'>[];
  category?: string;
}
