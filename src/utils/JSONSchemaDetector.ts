// JSON Schema Detector Utility
// Analyzes content and detects which JSON schema type it matches

import type { AnyJSONSchema, JSONSchemaType } from '@/types/JSONSchemas';

/**
 * Detect if content contains valid JSON and identify its schema type
 * @param content - String content to analyze
 * @returns Parsed JSON data with schemaType, or null if not valid JSON
 */
export function detectJSONSchema(content: string): (AnyJSONSchema & { schemaType: JSONSchemaType }) | null {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);

    // Detect schema type based on structure
    const schemaType = inferSchemaType(parsed);

    if (schemaType) {
      return {
        ...parsed,
        schemaType,
      };
    }

    return null;
  } catch {
    // Not valid JSON or doesn't match any known schema
    return null;
  }
}

/**
 * Infer schema type based on JSON structure
 * @param data - Parsed JSON object
 * @returns JSONSchemaType if matched, null otherwise
 */
function inferSchemaType(data: any): JSONSchemaType | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Scene Card detection
  if (
    hasRequiredKeys(data, [
      'video_introduction',
      'reference_images',
      'music',
      'assembly_steps',
      'patient_reflection_questions',
    ])
  ) {
    return 'scene_card';
  }

  // Music Generation detection
  if (
    hasRequiredKeys(data, ['instrumental_option', 'lyrical_option'])
    && isObject(data.instrumental_option)
    && isObject(data.lyrical_option)
  ) {
    return 'music_generation';
  }

  // Scene Suggestions detection
  if (hasRequiredKeys(data, ['potential_scenes_by_participant']) && Array.isArray(data.potential_scenes_by_participant)) {
    return 'scene_suggestions';
  }

  // Image References detection
  if (hasRequiredKeys(data, ['images']) && Array.isArray(data.images)) {
    // Verify it's not just any array, but array of image objects
    if (data.images.length > 0 && hasRequiredKeys(data.images[0], ['title', 'prompt'])) {
      return 'image_references';
    }
  }

  // Reflection Questions detection
  if (
    (hasRequiredKeys(data, ['patient_questions']) || hasRequiredKeys(data, ['reflection_questions']))
    && !hasRequiredKeys(data, ['reference_images']) // Not a scene card
  ) {
    return 'reflection_questions';
  }

  // Therapeutic Note detection
  if (hasRequiredKeys(data, ['note_title', 'note_content'])) {
    return 'therapeutic_note';
  }

  // Quote Extraction detection (two possible structures)
  if (hasRequiredKeys(data, ['extracted_quotes']) && Array.isArray(data.extracted_quotes)) {
    return 'quote_extraction';
  }

  if (hasRequiredKeys(data, ['quotes']) && Array.isArray(data.quotes)) {
    // Verify it's quotes structure
    if (data.quotes.length > 0 && hasRequiredKeys(data.quotes[0], ['text', 'speaker'])) {
      return 'quote_extraction';
    }
  }

  return null;
}

/**
 * Check if object has all required keys
 * @param obj - Object to check
 * @param keys - Required keys
 * @returns true if all keys present
 */
function hasRequiredKeys(obj: any, keys: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return keys.every(key => key in obj);
}

/**
 * Check if value is a plain object
 * @param value - Value to check
 * @returns true if plain object
 */
function isObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Extract JSON from markdown code blocks if present
 * @param content - Content that may contain markdown code blocks
 * @returns Extracted JSON string or original content
 */
export function extractJSONFromMarkdown(content: string): string {
  // Match JSON code blocks: ```json ... ``` or just ``` ... ```
  const jsonBlockRegex = /```(?:json)?\n?([\s\S]*?)\n?```/;
  const match = content.match(jsonBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return content;
}

/**
 * Validate JSON schema structure (basic validation)
 * @param data - Parsed JSON data
 * @param schemaType - Expected schema type
 * @returns true if structure is valid
 */
export function validateJSONSchema(data: any, schemaType: JSONSchemaType): boolean {
  try {
    switch (schemaType) {
      case 'scene_card':
        return (
          hasRequiredKeys(data, [
            'video_introduction',
            'reference_images',
            'music',
            'assembly_steps',
            'patient_reflection_questions',
          ])
          && Array.isArray(data.reference_images)
          && Array.isArray(data.patient_reflection_questions)
          && isObject(data.music)
        );

      case 'music_generation':
        return (
          hasRequiredKeys(data, ['instrumental_option', 'lyrical_option'])
          && isObject(data.instrumental_option)
          && isObject(data.lyrical_option)
          && hasRequiredKeys(data.instrumental_option, ['title', 'mood', 'style_prompt'])
          && hasRequiredKeys(data.lyrical_option, ['title', 'mood', 'suggested_lyrics'])
        );

      case 'scene_suggestions':
        return (
          hasRequiredKeys(data, ['potential_scenes_by_participant'])
          && Array.isArray(data.potential_scenes_by_participant)
          && data.potential_scenes_by_participant.every(
            (p: any) => hasRequiredKeys(p, ['for_patient_name', 'scenes']) && Array.isArray(p.scenes),
          )
        );

      case 'image_references':
        return (
          hasRequiredKeys(data, ['images'])
          && Array.isArray(data.images)
          && data.images.every((img: any) => hasRequiredKeys(img, ['title', 'prompt']))
        );

      case 'reflection_questions':
        return (
          hasRequiredKeys(data, ['patient_questions'])
          || hasRequiredKeys(data, ['reflection_questions'])
        );

      case 'therapeutic_note':
        return hasRequiredKeys(data, ['note_title', 'note_content']);

      case 'quote_extraction':
        return (
          (hasRequiredKeys(data, ['extracted_quotes']) && Array.isArray(data.extracted_quotes))
          || (hasRequiredKeys(data, ['quotes']) && Array.isArray(data.quotes))
        );

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Try to detect and extract JSON from various formats
 * @param content - Raw content (may include markdown, plain text, etc.)
 * @returns Detected JSON schema or null
 */
export function detectAndExtractJSON(content: string): (AnyJSONSchema & { schemaType: JSONSchemaType }) | null {
  // First, try direct JSON parsing
  let result = detectJSONSchema(content);
  if (result) {
    return result;
  }

  // Try extracting from markdown code blocks
  const extracted = extractJSONFromMarkdown(content);
  if (extracted !== content) {
    result = detectJSONSchema(extracted);
    if (result) {
      return result;
    }
  }

  return null;
}
