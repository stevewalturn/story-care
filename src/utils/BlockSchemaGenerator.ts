/**
 * Block Schema Generator
 *
 * Utilities for generating JSON schemas from building blocks and validating block configurations
 */

import type {
  BlockInstance,
  BlockType,
  ValidationError,
  ValidationResult,
} from '@/types/BuildingBlocks';
import { BLOCK_DEFINITIONS, VALIDATION_RULES } from '@/config/BlockDefinitions';

/**
 * Generate JSON schema from block instances
 * Attempts to detect known schema types, otherwise generates custom schema
 */
export function generateJSONSchema(blocks: BlockInstance[]): object {
  if (blocks.length === 0) {
    return {
      schemaType: 'custom',
      properties: {},
    };
  }

  // Detect if this matches a known schema type
  const schemaType = detectSchemaType(blocks);

  if (schemaType) {
    return generateKnownSchema(schemaType, blocks);
  }

  // Generate custom schema
  return generateCustomSchema(blocks);
}

/**
 * Detect if blocks match a predefined schema type
 */
function detectSchemaType(blocks: BlockInstance[]): string | null {
  const blockTypes = blocks.map(b => b.blockId);

  // Check for scene_card pattern
  if (
    blockTypes.includes('video_introduction')
    && blockTypes.includes('scene_assembly')
    && (blockTypes.includes('image_prompt') || blockTypes.includes('video_prompt'))
  ) {
    return 'scene_card';
  }

  // Check for image_references pattern (multiple image prompts)
  if (blockTypes.every(t => t === 'image_prompt') && blocks.length > 1) {
    return 'image_references';
  }

  // Check for video_references pattern (multiple video prompts)
  if (blockTypes.every(t => t === 'video_prompt') && blocks.length > 1) {
    return 'video_references';
  }

  // Check for reflection_questions pattern
  if (blockTypes.every(t => t === 'reflection_question') && blocks.length >= 1) {
    return 'reflection_questions';
  }

  // Check for quote_extraction pattern
  if (blocks.length === 1 && blockTypes[0] === 'quote') {
    return 'quote_extraction';
  }

  // Check for therapeutic_note pattern
  if (blocks.length === 1 && blockTypes[0] === 'therapeutic_note') {
    return 'therapeutic_note';
  }

  // Check for music_generation pattern
  if (blocks.length === 1 && blockTypes[0] === 'music_generation') {
    return 'music_generation';
  }

  // Check for scene_suggestions pattern
  if (blocks.length === 1 && blockTypes[0] === 'scene_suggestion') {
    return 'scene_suggestions';
  }

  return null;
}

/**
 * Generate schema for known predefined types
 */
function generateKnownSchema(schemaType: string, blocks: BlockInstance[]): object {
  switch (schemaType) {
    case 'scene_card':
      return generateSceneCardSchema(blocks);

    case 'image_references':
      return generateImageReferencesSchema(blocks);

    case 'video_references':
      return generateVideoReferencesSchema(blocks);

    case 'reflection_questions':
      return generateReflectionQuestionsSchema(blocks);

    case 'quote_extraction':
      return blocks[0] ? generateQuoteExtractionSchema(blocks[0]) : generateCustomSchema(blocks);

    case 'therapeutic_note':
      return blocks[0] ? generateTherapeuticNoteSchema(blocks[0]) : generateCustomSchema(blocks);

    case 'music_generation':
      return blocks[0] ? generateMusicGenerationSchema(blocks[0]) : generateCustomSchema(blocks);

    case 'scene_suggestions':
      return blocks[0] ? generateSceneSuggestionsSchema(blocks[0]) : generateCustomSchema(blocks);

    default:
      return generateCustomSchema(blocks);
  }
}

/**
 * Generate scene_card schema
 */
function generateSceneCardSchema(blocks: BlockInstance[]): object {
  const videoIntro = blocks.find(b => b.blockId === 'video_introduction');
  const images = blocks.filter(b => b.blockId === 'image_prompt');
  const music = blocks.find(b => b.blockId === 'music_generation');
  const assembly = blocks.find(b => b.blockId === 'scene_assembly');

  return {
    schemaType: 'scene_card',
    video_introduction: videoIntro ? videoIntro.values : {},
    reference_images: images.map(img => img.values),
    music: music ? music.values : {},
    assembly_steps: assembly ? assembly.values : {},
  };
}

/**
 * Generate image_references schema
 */
function generateImageReferencesSchema(blocks: BlockInstance[]): object {
  return {
    schemaType: 'image_references',
    images: blocks.map(block => block.values),
  };
}

/**
 * Generate video_references schema
 */
function generateVideoReferencesSchema(blocks: BlockInstance[]): object {
  return {
    schemaType: 'video_references',
    videos: blocks.map(block => block.values),
  };
}

/**
 * Generate reflection_questions schema
 */
function generateReflectionQuestionsSchema(blocks: BlockInstance[]): object {
  return {
    schemaType: 'reflection_questions',
    questions: blocks.map(block => block.values),
  };
}

/**
 * Generate quote_extraction schema
 */
function generateQuoteExtractionSchema(block: BlockInstance): object {
  return {
    schemaType: 'quote_extraction',
    ...block.values,
  };
}

/**
 * Generate therapeutic_note schema
 */
function generateTherapeuticNoteSchema(block: BlockInstance): object {
  return {
    schemaType: 'therapeutic_note',
    ...block.values,
  };
}

/**
 * Generate music_generation schema
 */
function generateMusicGenerationSchema(block: BlockInstance): object {
  return {
    schemaType: 'music_generation',
    ...block.values,
  };
}

/**
 * Generate scene_suggestions schema
 */
function generateSceneSuggestionsSchema(block: BlockInstance): object {
  return {
    schemaType: 'scene_suggestions',
    ...block.values,
  };
}

/**
 * Generate custom schema for unknown block combinations
 */
function generateCustomSchema(blocks: BlockInstance[]): object {
  const properties: Record<string, any> = {};

  blocks.forEach((block) => {
    const definition = BLOCK_DEFINITIONS[block.blockId];
    if (!definition) return;

    // Use instance ID as property name for custom schemas
    properties[block.instanceId] = {
      type: 'object',
      blockType: block.blockId,
      ...definition.outputSchema,
      values: block.values,
    };
  });

  return {
    schemaType: 'custom',
    properties,
  };
}

/**
 * Validate block instances
 * Checks required fields, validation rules, and combination rules
 */
export function validateBlocks(blocks: BlockInstance[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate individual blocks
  blocks.forEach((block) => {
    const blockErrors = validateBlockInstance(block);
    errors.push(...blockErrors);
  });

  // Validate block combinations
  const combinationErrors = validateBlockCombinations(blocks);
  errors.push(...combinationErrors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single block instance
 */
function validateBlockInstance(block: BlockInstance): ValidationError[] {
  const errors: ValidationError[] = [];
  const definition = BLOCK_DEFINITIONS[block.blockId];

  if (!definition) {
    errors.push({
      blockInstanceId: block.instanceId,
      blockType: block.blockId,
      message: `Unknown block type: ${block.blockId}`,
      severity: 'error',
    });
    return errors;
  }

  // Check required fields
  definition.fields.forEach((field) => {
    if (field.required && !block.values[field.id]) {
      errors.push({
        blockInstanceId: block.instanceId,
        blockType: block.blockId,
        field: field.id,
        message: `${definition.label}: ${field.label} is required`,
        severity: 'error',
      });
    }

    // Validate field values
    if (block.values[field.id] !== undefined && block.values[field.id] !== null) {
      const fieldErrors = validateFieldValue(
        field.id,
        block.values[field.id],
        field,
        definition.label,
        block.instanceId,
        block.blockId,
      );
      errors.push(...fieldErrors);
    }
  });

  return errors;
}

/**
 * Validate a field value against its validation rules
 */
function validateFieldValue(
  fieldId: string,
  value: any,
  field: any,
  blockLabel: string,
  instanceId: string,
  blockType: BlockType,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!field.validation) return errors;

  const validation = field.validation;

  // String length validation
  if (typeof value === 'string') {
    if (validation.minLength && value.length < validation.minLength) {
      errors.push({
        blockInstanceId: instanceId,
        blockType,
        field: fieldId,
        message: `${blockLabel}: ${field.label} must be at least ${validation.minLength} characters`,
        severity: 'error',
      });
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      errors.push({
        blockInstanceId: instanceId,
        blockType,
        field: fieldId,
        message: `${blockLabel}: ${field.label} must be at most ${validation.maxLength} characters`,
        severity: 'error',
      });
    }

    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        errors.push({
          blockInstanceId: instanceId,
          blockType,
          field: fieldId,
          message: `${blockLabel}: ${field.label} format is invalid`,
          severity: 'error',
        });
      }
    }
  }

  // Number validation
  if (typeof value === 'number') {
    if (validation.min !== undefined && value < validation.min) {
      errors.push({
        blockInstanceId: instanceId,
        blockType,
        field: fieldId,
        message: `${blockLabel}: ${field.label} must be at least ${validation.min}`,
        severity: 'error',
      });
    }

    if (validation.max !== undefined && value > validation.max) {
      errors.push({
        blockInstanceId: instanceId,
        blockType,
        field: fieldId,
        message: `${blockLabel}: ${field.label} must be at most ${validation.max}`,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Validate block combinations against rules
 */
function validateBlockCombinations(blocks: BlockInstance[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Count blocks by type
  const blockCounts: Record<string, number> = {};
  blocks.forEach((block) => {
    blockCounts[block.blockId] = (blockCounts[block.blockId] || 0) + 1;
  });

  // Check validation rules
  VALIDATION_RULES.forEach((rule) => {
    const count = blockCounts[rule.blockType] || 0;

    // Check minimum
    if (rule.min !== undefined && count < rule.min) {
      errors.push({
        blockType: rule.blockType,
        message: `At least ${rule.min} ${rule.blockType} block(s) required`,
        severity: 'error',
      });
    }

    // Check maximum
    if (rule.max !== undefined && count > rule.max) {
      errors.push({
        blockType: rule.blockType,
        message: `At most ${rule.max} ${rule.blockType} block(s) allowed`,
        severity: 'error',
      });
    }

    // Check requiredWith
    if (rule.requiredWith && count > 0) {
      rule.requiredWith.forEach((requiredType) => {
        if (!blockCounts[requiredType]) {
          errors.push({
            blockType: rule.blockType,
            message: `${rule.blockType} requires ${requiredType} block`,
            severity: 'error',
          });
        }
      });
    }

    // Check conflictsWith
    if (rule.conflictsWith && count > 0) {
      rule.conflictsWith.forEach((conflictType) => {
        if (blockCounts[conflictType]) {
          errors.push({
            blockType: rule.blockType,
            message: `${rule.blockType} cannot be used with ${conflictType}`,
            severity: 'error',
          });
        }
      });
    }

    // Run custom validator if present
    if (rule.customValidator) {
      const result = rule.customValidator(blocks);
      if (!result.valid) {
        errors.push({
          blockType: rule.blockType,
          message: result.message || 'Custom validation failed',
          severity: 'error',
        });
      }
    }
  });

  return errors;
}

/**
 * Parse JSON schema back into blocks (for editing existing prompts)
 * Best effort - may not work for all custom schemas
 */
export function parseSchemaToBlocks(jsonSchema: any): BlockInstance[] {
  if (!jsonSchema || typeof jsonSchema !== 'object') {
    return [];
  }

  const blocks: BlockInstance[] = [];
  const schemaType = jsonSchema.schemaType;

  switch (schemaType) {
    case 'scene_card':
      blocks.push(...parseSceneCardToBlocks(jsonSchema));
      break;

    case 'image_references':
      blocks.push(...parseImageReferencesToBlocks(jsonSchema));
      break;

    case 'video_references':
      blocks.push(...parseVideoReferencesToBlocks(jsonSchema));
      break;

    case 'reflection_questions':
      blocks.push(...parseReflectionQuestionsToBlocks(jsonSchema));
      break;

    case 'quote_extraction':
      blocks.push(parseSingleBlockSchema(jsonSchema, 'quote'));
      break;

    case 'therapeutic_note':
      blocks.push(parseSingleBlockSchema(jsonSchema, 'therapeutic_note'));
      break;

    case 'music_generation':
      blocks.push(parseSingleBlockSchema(jsonSchema, 'music_generation'));
      break;

    case 'scene_suggestions':
      blocks.push(parseSingleBlockSchema(jsonSchema, 'scene_suggestion'));
      break;

    case 'custom':
      blocks.push(...parseCustomSchemaToBlocks(jsonSchema));
      break;

    default:
      // Try to parse as generic JSON Schema (with properties, type, required, etc.)
      if (!schemaType && jsonSchema.type === 'object' && jsonSchema.properties) {
        blocks.push(...parseGenericJSONSchema(jsonSchema));
      }
      break;
  }

  // Assign order
  return blocks.map((block, index) => ({ ...block, order: index }));
}

/**
 * Helper functions for parsing specific schema types
 */
function parseSceneCardToBlocks(schema: any): BlockInstance[] {
  const blocks: BlockInstance[] = [];
  let order = 0;

  if (schema.video_introduction) {
    blocks.push({
      blockId: 'video_introduction',
      instanceId: `video_intro_${Date.now()}`,
      values: schema.video_introduction,
      order: order++,
    });
  }

  if (schema.reference_images && Array.isArray(schema.reference_images)) {
    schema.reference_images.forEach((image: any, index: number) => {
      blocks.push({
        blockId: 'image_prompt',
        instanceId: `image_${Date.now()}_${index}`,
        values: image,
        order: order++,
      });
    });
  }

  if (schema.music) {
    blocks.push({
      blockId: 'music_generation',
      instanceId: `music_${Date.now()}`,
      values: schema.music,
      order: order++,
    });
  }

  if (schema.assembly_steps) {
    blocks.push({
      blockId: 'scene_assembly',
      instanceId: `assembly_${Date.now()}`,
      values: schema.assembly_steps,
      order: order++,
    });
  }

  return blocks;
}

function parseImageReferencesToBlocks(schema: any): BlockInstance[] {
  if (!schema.images || !Array.isArray(schema.images)) return [];

  return schema.images.map((image: any, index: number) => ({
    blockId: 'image_prompt',
    instanceId: `image_${Date.now()}_${index}`,
    values: image,
    order: index,
  }));
}

function parseVideoReferencesToBlocks(schema: any): BlockInstance[] {
  if (!schema.videos || !Array.isArray(schema.videos)) return [];

  return schema.videos.map((video: any, index: number) => ({
    blockId: 'video_prompt',
    instanceId: `video_${Date.now()}_${index}`,
    values: video,
    order: index,
  }));
}

function parseReflectionQuestionsToBlocks(schema: any): BlockInstance[] {
  if (!schema.questions || !Array.isArray(schema.questions)) return [];

  return schema.questions.map((question: any, index: number) => ({
    blockId: 'reflection_question',
    instanceId: `reflection_${Date.now()}_${index}`,
    values: question,
    order: index,
  }));
}

function parseSingleBlockSchema(schema: any, blockType: BlockType): BlockInstance {
  const values = { ...schema };
  delete values.schemaType; // Remove schemaType from values

  return {
    blockId: blockType,
    instanceId: `${blockType}_${Date.now()}`,
    values,
    order: 0,
  };
}

function parseCustomSchemaToBlocks(schema: any): BlockInstance[] {
  if (!schema.properties) return [];

  return Object.entries(schema.properties).map(([key, value]: [string, any], index) => ({
    blockId: value.blockType || 'image_prompt', // Fallback to image_prompt
    instanceId: key,
    values: value.values || {},
    order: index,
  }));
}

/**
 * Parse generic JSON Schema (standard format with properties, type, required, etc.)
 * Attempts to create a visual representation using building blocks
 */
function parseGenericJSONSchema(jsonSchema: any): BlockInstance[] {
  const blocks: BlockInstance[] = [];

  // Detect the best block type based on schema properties
  const properties = jsonSchema.properties || {};
  const propertyKeys = Object.keys(properties);

  // Check for common patterns to determine block type

  // Pattern 1: Therapeutic Note (has title, content, tags, keyInsights, actionItems)
  if (
    propertyKeys.includes('title')
    && propertyKeys.includes('content')
    && (propertyKeys.includes('tags') || propertyKeys.includes('keyInsights') || propertyKeys.includes('actionItems'))
  ) {
    blocks.push({
      blockId: 'therapeutic_note',
      instanceId: `therapeutic_note_${Date.now()}`,
      values: {
        title: properties.title?.default || 'Therapeutic Note',
        content_prompt: 'Generate therapeutic note based on transcript analysis',
      },
      order: 0,
    });
  }
  // Pattern 2: Quote Extraction (has quoteText, speaker, etc.)
  else if (propertyKeys.includes('quoteText') || propertyKeys.includes('quote_text') || propertyKeys.includes('text')) {
    blocks.push({
      blockId: 'quote',
      instanceId: `quote_${Date.now()}`,
      values: {
        extraction_instruction: 'Extract meaningful quotes from the transcript',
        min_quotes: 1,
        max_quotes: 5,
      },
      order: 0,
    });
  }
  // Pattern 3: Questions (has questions array)
  else if (propertyKeys.includes('questions') && properties.questions?.type === 'array') {
    blocks.push({
      blockId: 'reflection_question',
      instanceId: `reflection_${Date.now()}`,
      values: {
        question: 'Reflection question based on session',
        context: 'Session analysis',
      },
      order: 0,
    });
  }
  // Pattern 4: Images (has images array, image_url, or prompt)
  else if (
    propertyKeys.includes('images')
    || propertyKeys.includes('image_url')
    || propertyKeys.includes('imageUrl')
    || (propertyKeys.includes('prompt') && propertyKeys.includes('style'))
  ) {
    blocks.push({
      blockId: 'image_prompt',
      instanceId: `image_${Date.now()}`,
      values: {
        title: 'Generated Image',
        prompt: 'Image generation prompt',
        style: 'photorealistic',
      },
      order: 0,
    });
  }
  // Pattern 5: Music/Audio (has audio_url, lyrics, musicStyle, etc.)
  else if (
    propertyKeys.includes('audio_url')
    || propertyKeys.includes('audioUrl')
    || propertyKeys.includes('lyrics')
    || propertyKeys.includes('musicStyle')
  ) {
    blocks.push({
      blockId: 'music_generation',
      instanceId: `music_${Date.now()}`,
      values: {
        title: 'Generated Music',
        music_type: 'instrumental',
        music_style: 'calm',
      },
      order: 0,
    });
  }
  // Generic fallback: Create a text_output block
  else {
    blocks.push({
      blockId: 'text_output',
      instanceId: `text_output_${Date.now()}`,
      values: {
        title: 'AI Response',
        content_type: 'text',
        prompt_for_content: 'Generate response based on the schema structure',
      },
      order: 0,
    });
  }

  return blocks;
}
