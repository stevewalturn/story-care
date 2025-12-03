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
  // Existing content blocks
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
  | 'array_container'
  // New output and action blocks
  | 'text_output'
  | 'save_quote_action'
  | 'generate_image_action'
  | 'generate_music_action';

/**
 * Block categories for organization in the palette
 */
export type BlockCategory = 'media' | 'content' | 'structure' | 'interaction' | 'action' | 'output';

/**
 * Execution mode for blocks in a workflow
 */
export type ExecutionMode = 'auto' | 'manual';

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
 * Display configuration for block output rendering
 */
export interface BlockOutputDisplay {
  renderAs: 'text' | 'image' | 'audio' | 'video' | 'quote' | 'card' | 'list' | 'custom';
  primaryField?: string; // Main content field to display (e.g., 'content', 'lyrics', 'quote_text')
  titleField?: string; // Field to use as title
  subtitleField?: string; // Field to use as subtitle
  imageField?: string; // Field containing image URL
  audioField?: string; // Field containing audio URL
  metadataFields?: string[]; // Additional fields to show as metadata
  collapsible?: boolean; // Whether the output can be collapsed
  defaultExpanded?: boolean; // Whether to show expanded by default
  customRenderer?: string; // Name of custom renderer component if needed
}

/**
 * Action handler configuration for manual blocks
 */
export interface BlockActionHandler {
  handlerName: string; // Name of the handler function
  apiEndpoint?: string; // API endpoint to call
  confirmationMessage?: string; // Confirmation dialog before execution
  successMessage?: string; // Message to show on success
  errorMessage?: string; // Message to show on error
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
  executionMode?: ExecutionMode; // How this block executes in a workflow
  supportsTemplates?: boolean; // Whether fields support {{variable}} templates
  outputDisplay?: BlockOutputDisplay; // How to render the output
  actionHandler?: BlockActionHandler; // Action handler for manual blocks
}

/**
 * Instance of a block with user-configured values
 */
export interface BlockInstance {
  blockId: BlockType;
  instanceId: string;
  values: Record<string, any>;
  customLabels?: Record<string, string>; // Custom field labels (fieldId -> custom label)
  order: number;
  executionMode?: ExecutionMode; // Override execution mode for this instance
  outputKey?: string; // Key to store output in workflow context (e.g., "step1")
  executionStatus?: 'pending' | 'processing' | 'completed' | 'failed'; // Runtime status
  executionResult?: any; // Runtime result from execution
  executionError?: string; // Runtime error message if failed
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

/**
 * Workflow execution context that accumulates as steps complete
 */
export interface WorkflowContext {
  [key: string]: any; // Dynamic keys for step outputs (e.g., step1: { lyrics: "..." })
  sessionId?: string;
  patientId?: string;
  therapistId?: string;
  organizationId?: string;
}

/**
 * Workflow execution state
 */
export interface WorkflowExecution {
  id: string;
  promptId: string;
  blocks: BlockInstance[];
  context: WorkflowContext;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStepIndex: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Action execution request
 */
export interface ActionExecutionRequest {
  blockInstanceId: string;
  blockType: BlockType;
  values: Record<string, any>;
  context: WorkflowContext;
}

/**
 * Action execution result
 */
export interface ActionExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  updatedContext?: Partial<WorkflowContext>;
}
