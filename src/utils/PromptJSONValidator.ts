/**
 * Prompt JSON Validator
 * Validates JSON structure for AI prompts with expected output schemas
 *
 * Supports two modes:
 * 1. JSON Schema validation (for schema definitions with type/properties)
 * 2. Output Data validation (for actual AI responses with schemaType field)
 */

import type { SchemaType } from '@/config/PromptJSONTemplates';
import { getAllSchemaTypes } from '@/config/PromptJSONTemplates';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Detect if JSON is a JSON Schema definition or output data
 */
function isJSONSchema(parsed: any): boolean {
  // JSON Schema has "type" and "properties" at root level
  // Output data has "schemaType" as a string value

  if (typeof parsed.schemaType === 'string') {
    // This is output data (schemaType is a value, not a property definition)
    return false;
  }

  if (parsed.type === 'object' && parsed.properties && typeof parsed.properties === 'object') {
    // This looks like a JSON Schema definition
    return true;
  }

  return false; // Default to treating as output data
}

/**
 * Validate prompt JSON output structure
 * Handles both JSON Schema definitions and output data
 */
export function validatePromptJSON(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Check if it's valid JSON
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  }
  catch (error) {
    return {
      isValid: false,
      errors: [`Invalid JSON syntax: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }

  // Step 2: Check if it's an object
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    errors.push('JSON must be an object (not an array or primitive value)');
    return {
      isValid: false,
      errors,
      warnings,
    };
  }

  // Step 3: Detect if this is a JSON Schema or output data
  const isSchema = isJSONSchema(parsed);

  if (isSchema) {
    // Validate JSON Schema structure
    const schemaErrors = validateJSONSchemaDefinition(parsed);
    errors.push(...schemaErrors.errors);
    warnings.push(...schemaErrors.warnings);
  }
  else {
    // Validate output data structure (existing logic)
    if (!parsed.schemaType) {
      errors.push('Missing required field: "schemaType"');
    }
    else {
      // Validate schemaType is supported
      const supportedTypes = getAllSchemaTypes();
      if (!supportedTypes.includes(parsed.schemaType)) {
        errors.push(`Unknown schemaType: "${parsed.schemaType}". Supported types: ${supportedTypes.join(', ')}`);
      }
      else {
        // Validate structure per schema type
        const schemaErrors = validateSchemaStructure(parsed, parsed.schemaType);
        errors.push(...schemaErrors);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate JSON Schema definition structure
 */
function validateJSONSchemaDefinition(schema: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Must have "type": "object"
  if (schema.type !== 'object') {
    errors.push('JSON Schema must have "type": "object" at root level');
  }

  // Must have "properties"
  if (!schema.properties || typeof schema.properties !== 'object') {
    errors.push('JSON Schema must have "properties" object');
    return { errors, warnings }; // Can't continue validation without properties
  }

  // Check if schemaType property exists and is properly defined
  if (!schema.properties.schemaType) {
    warnings.push('Schema should include "schemaType" property to identify output type');
  }
  else {
    const schemaTypeProp = schema.properties.schemaType;

    // Validate schemaType property structure
    if (schemaTypeProp.type !== 'string') {
      errors.push('schemaType property must have "type": "string"');
    }

    if (schemaTypeProp.enum && Array.isArray(schemaTypeProp.enum)) {
      const supportedTypes = getAllSchemaTypes();
      const supportedTypesSet = new Set(supportedTypes);
      const invalidTypes = schemaTypeProp.enum.filter((t: string) => !supportedTypesSet.has(t as any));
      if (invalidTypes.length > 0) {
        errors.push(`schemaType enum contains unsupported types: ${invalidTypes.join(', ')}. Supported: ${supportedTypes.join(', ')}`);
      }
    }
    else {
      warnings.push('schemaType property should have an "enum" array specifying valid schema types');
    }
  }

  // Validate "required" array if present
  if (schema.required) {
    if (!Array.isArray(schema.required)) {
      errors.push('"required" must be an array');
    }
    else {
      // Check that required fields exist in properties
      schema.required.forEach((field: string) => {
        if (!schema.properties[field]) {
          errors.push(`Required field "${field}" is not defined in properties`);
        }
      });

      // Recommend including schemaType in required
      if (schema.properties.schemaType && !schema.required.includes('schemaType')) {
        warnings.push('Consider adding "schemaType" to required array for better validation');
      }
    }
  }
  else {
    warnings.push('Schema should have a "required" array listing mandatory fields');
  }

  return { errors, warnings };
}

/**
 * Validate structure for specific schema type
 * IMPORTANT: Field names MUST match TypeScript types in src/types/JSONSchemas.ts
 * All field names use snake_case with underscores
 */
function validateSchemaStructure(data: any, schemaType: SchemaType): string[] {
  const errors: string[] = [];

  switch (schemaType) {
    case 'therapeutic_note':
      // Required fields: note_title, note_content
      if (!data.note_title || typeof data.note_title !== 'string') {
        errors.push('Missing or invalid "note_title" (required string)');
      }
      if (!data.note_content || typeof data.note_content !== 'string') {
        errors.push('Missing or invalid "note_content" (required string)');
      }
      // Optional fields: tags, key_themes, action_items (arrays)
      if (data.tags && !Array.isArray(data.tags)) {
        errors.push('"tags" must be an array of strings');
      }
      if (data.key_themes && !Array.isArray(data.key_themes)) {
        errors.push('"key_themes" must be an array of strings');
      }
      if (data.action_items && !Array.isArray(data.action_items)) {
        errors.push('"action_items" must be an array of strings');
      }
      break;

    case 'image_references':
      if (!data.images || !Array.isArray(data.images)) {
        errors.push('Missing or invalid "images" array');
      }
      else {
        if (data.images.length === 0) {
          errors.push('"images" array cannot be empty');
        }
        data.images.forEach((img: any, index: number) => {
          if (!img.title) errors.push(`images[${index}]: Missing "title"`);
          if (!img.prompt) errors.push(`images[${index}]: Missing "prompt"`);
          if (!img.style) errors.push(`images[${index}]: Missing "style"`);
          if (!img.therapeutic_purpose) errors.push(`images[${index}]: Missing "therapeutic_purpose"`);
          // source_quote is optional
        });
      }
      break;

    case 'video_references':
      if (!data.videos || !Array.isArray(data.videos)) {
        errors.push('Missing or invalid "videos" array');
      }
      else {
        if (data.videos.length === 0) {
          errors.push('"videos" array cannot be empty');
        }
        data.videos.forEach((video: any, index: number) => {
          if (!video.title) errors.push(`videos[${index}]: Missing "title"`);
          if (!video.prompt) errors.push(`videos[${index}]: Missing "prompt"`);
          if (!video.duration || typeof video.duration !== 'number') {
            errors.push(`videos[${index}]: Missing or invalid "duration" (must be number)`);
          }
          if (!video.style) errors.push(`videos[${index}]: Missing "style"`);
          if (!video.therapeutic_purpose) errors.push(`videos[${index}]: Missing "therapeutic_purpose"`);
          // reference_image_prompt, source_quote, motion_description are optional
        });
      }
      break;

    case 'music_generation':
      // Must have at least one of instrumental_option or lyrical_option
      if (!data.instrumental_option && !data.lyrical_option) {
        errors.push('Must include at least one of "instrumental_option" or "lyrical_option"');
      }
      if (data.instrumental_option) {
        if (!data.instrumental_option.music_description) {
          errors.push('instrumental_option: Missing "music_description"');
        }
        if (!data.instrumental_option.title) {
          errors.push('instrumental_option: Missing "title"');
        }
        if (!data.instrumental_option.style_prompt) {
          errors.push('instrumental_option: Missing "style_prompt"');
        }
      }
      if (data.lyrical_option) {
        if (!data.lyrical_option.song_concept) {
          errors.push('lyrical_option: Missing "song_concept"');
        }
        if (!data.lyrical_option.suggested_lyrics) {
          errors.push('lyrical_option: Missing "suggested_lyrics"');
        }
        if (!data.lyrical_option.title) {
          errors.push('lyrical_option: Missing "title"');
        }
        if (!data.lyrical_option.style_prompt) {
          errors.push('lyrical_option: Missing "style_prompt"');
        }
      }
      break;

    case 'scene_card':
      // Required fields
      if (!data.video_introduction) errors.push('Missing "video_introduction"');
      if (!data.patient_reflection_questions || !Array.isArray(data.patient_reflection_questions)) {
        errors.push('Missing or invalid "patient_reflection_questions" array');
      }
      if (!data.reference_images || !Array.isArray(data.reference_images)) {
        errors.push('Missing or invalid "reference_images" array');
      }
      else {
        data.reference_images.forEach((img: any, index: number) => {
          if (!img.stage_name) errors.push(`reference_images[${index}]: Missing "stage_name"`);
          if (!img.title) errors.push(`reference_images[${index}]: Missing "title"`);
          if (!img.image_prompt) errors.push(`reference_images[${index}]: Missing "image_prompt"`);
          if (!img.meaning) errors.push(`reference_images[${index}]: Missing "meaning"`);
          // patient_quote_anchor and animation_instructions are optional
        });
      }
      if (!data.music) {
        errors.push('Missing "music" object');
      }
      else {
        if (!data.music.prompt) errors.push('music: Missing "prompt"');
      }
      // group_reflection_questions, assembly_steps, buttons are optional
      break;

    case 'scene_suggestions':
      if (!data.potential_scenes_by_participant || !Array.isArray(data.potential_scenes_by_participant)) {
        errors.push('Missing or invalid "potential_scenes_by_participant" array');
      }
      else {
        data.potential_scenes_by_participant.forEach((participant: any, pIndex: number) => {
          if (!participant.for_patient_name) {
            errors.push(`potential_scenes_by_participant[${pIndex}]: Missing "for_patient_name"`);
          }
          if (!participant.scenes || !Array.isArray(participant.scenes)) {
            errors.push(`potential_scenes_by_participant[${pIndex}]: Missing or invalid "scenes" array`);
          }
          else {
            participant.scenes.forEach((scene: any, sIndex: number) => {
              if (!scene.scene_title) {
                errors.push(`potential_scenes_by_participant[${pIndex}].scenes[${sIndex}]: Missing "scene_title"`);
              }
              if (!scene.scene_description) {
                errors.push(`potential_scenes_by_participant[${pIndex}].scenes[${sIndex}]: Missing "scene_description"`);
              }
              if (!scene.therapeutic_rationale) {
                errors.push(`potential_scenes_by_participant[${pIndex}].scenes[${sIndex}]: Missing "therapeutic_rationale"`);
              }
              // key_quote and scene_focus_instruction are optional
            });
          }
        });
      }
      break;

    case 'reflection_questions':
      // Required: patient_questions array
      if (!data.patient_questions || !Array.isArray(data.patient_questions)) {
        errors.push('Missing or invalid "patient_questions" array');
      }
      else {
        if (data.patient_questions.length === 0) {
          errors.push('"patient_questions" array cannot be empty');
        }
        data.patient_questions.forEach((q: any, index: number) => {
          if (typeof q !== 'string') {
            errors.push(`patient_questions[${index}]: Must be a string`);
          }
        });
      }
      // group_questions and context are optional
      if (data.group_questions && !Array.isArray(data.group_questions)) {
        errors.push('"group_questions" must be an array');
      }
      break;

    case 'quote_extraction':
      if (!data.extracted_quotes || !Array.isArray(data.extracted_quotes)) {
        errors.push('Missing or invalid "extracted_quotes" array');
      }
      else {
        if (data.extracted_quotes.length === 0) {
          errors.push('"extracted_quotes" array cannot be empty');
        }
        data.extracted_quotes.forEach((quote: any, index: number) => {
          if (!quote.quote_text) errors.push(`extracted_quotes[${index}]: Missing "quote_text"`);
          if (!quote.speaker) errors.push(`extracted_quotes[${index}]: Missing "speaker"`);
          if (!quote.context) errors.push(`extracted_quotes[${index}]: Missing "context"`);
          // tags and timestamp are optional
          if (quote.timestamp) {
            if (typeof quote.timestamp.start !== 'number') {
              errors.push(`extracted_quotes[${index}]: timestamp.start must be a number`);
            }
            if (typeof quote.timestamp.end !== 'number') {
              errors.push(`extracted_quotes[${index}]: timestamp.end must be a number`);
            }
          }
        });
      }
      break;

    default:
      // Unknown schema type (already caught in previous validation)
      break;
  }

  return errors;
}

/**
 * Format JSON string with proper indentation
 */
export function formatJSON(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  }
  catch {
    // If parsing fails, return original
    return jsonString;
  }
}

/**
 * Minify JSON string (remove whitespace)
 */
export function minifyJSON(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  }
  catch {
    // If parsing fails, return original
    return jsonString;
  }
}
