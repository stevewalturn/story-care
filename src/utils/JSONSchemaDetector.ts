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
    const parsed = JSON.parse(content);
    console.log('[detectJSONSchema] Parsed JSON successfully, keys:', Object.keys(parsed));

    const schemaType = inferSchemaType(parsed);
    console.log('[detectJSONSchema] Inferred schema type:', schemaType);

    if (schemaType) {
      return { ...parsed, schemaType };
    }

    console.warn('[detectJSONSchema] Could not infer schema type. Parsed data:', parsed);
    return null;
  } catch (error) {
    console.warn('[detectJSONSchema] JSON parse failed - MALFORMED JSON DETECTED');
    console.warn('[detectJSONSchema] Error:', error);
    console.warn('[detectJSONSchema] Content preview:', content.substring(0, 300));
    // Return null to indicate malformed JSON - caller should retry the AI request
    return null;
  }
}

/**
 * Validate that a data object matches the expected structure for a given schema type
 * @param data - Parsed JSON object
 * @param schemaType - Expected schema type
 * @returns true if structure matches, false otherwise
 */
function validateSchemaStructure(data: any, schemaType: JSONSchemaType): boolean {
  switch (schemaType) {
    case 'scene_visualization':
      return hasRequiredKeys(data, ['title', 'description', 'dalle_prompt', 'mood', 'symbolic_elements']);
    case 'image_references':
      return hasRequiredKeys(data, ['images']) && Array.isArray(data.images)
        && data.images.length > 0 && hasRequiredKeys(data.images[0], ['title', 'prompt']);
    case 'video_references':
      return hasRequiredKeys(data, ['videos']) && Array.isArray(data.videos)
        && data.videos.length > 0 && hasRequiredKeys(data.videos[0], ['title', 'prompt']);
    case 'scene_card':
      return hasRequiredKeys(data, ['video_introduction', 'reference_images', 'music', 'assembly_steps', 'patient_reflection_questions']);
    case 'therapeutic_scene_card':
      return hasRequiredKeys(data, ['title', 'patient', 'scenes', 'status']) && Array.isArray(data.scenes);
    case 'music_generation':
      return hasRequiredKeys(data, ['instrumental_option', 'lyrical_option']);
    case 'therapeutic_note':
      return hasRequiredKeys(data, ['note_title', 'note_content']) || hasRequiredKeys(data, ['title', 'content']);
    // Add more cases as needed
    default:
      // For schemas we haven't explicitly validated, assume it's valid
      return true;
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

  // If schemaType is explicitly provided, validate it matches structure
  if (data.schemaType && typeof data.schemaType === 'string') {
    const explicitType = data.schemaType as JSONSchemaType;

    // Validate that the structure matches the claimed schema type
    const structureMatches = validateSchemaStructure(data, explicitType);

    if (!structureMatches) {
      console.warn(
        `[JSONSchemaDetector] Schema mismatch: Explicit schemaType="${explicitType}" but structure doesn't match expected fields.`,
        '\nReceived data:',
        data,
        '\nExpected fields for',
        explicitType,
        'not found.',
      );
    }

    // Return the explicit type anyway (let the renderer handle the mismatch)
    return explicitType;
  }

  // Therapeutic Scene Card detection (check this BEFORE scene_card)
  if (
    hasRequiredKeys(data, ['title', 'patient', 'scenes', 'status'])
    && Array.isArray(data.scenes)
    && data.scenes.length > 0
    && hasRequiredKeys(data.scenes[0], ['sceneNumber', 'sections'])
  ) {
    return 'therapeutic_scene_card';
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

  // Video References detection
  if (hasRequiredKeys(data, ['videos']) && Array.isArray(data.videos)) {
    // Verify it's not just any array, but array of video objects
    if (data.videos.length > 0 && hasRequiredKeys(data.videos[0], ['title', 'prompt'])) {
      return 'video_references';
    }
  }

  // Reflection Questions detection
  if (
    (hasRequiredKeys(data, ['patient_questions']) || hasRequiredKeys(data, ['reflection_questions']))
    && !hasRequiredKeys(data, ['reference_images']) // Not a scene card
  ) {
    return 'reflection_questions';
  }

  // Therapeutic Note detection - support both old and new field names
  if (hasRequiredKeys(data, ['note_title', 'note_content']) || hasRequiredKeys(data, ['title', 'content'])) {
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

  // Extraction schemas
  if (hasRequiredKeys(data, ['metaphors']) && Array.isArray(data.metaphors)) {
    return 'metaphor_extraction';
  }

  if (hasRequiredKeys(data, ['moments']) && Array.isArray(data.moments)) {
    return 'key_moments';
  }

  if (hasRequiredKeys(data, ['values', 'beliefs'])) {
    return 'values_beliefs';
  }

  if (hasRequiredKeys(data, ['goals']) && Array.isArray(data.goals)) {
    return 'goals_intentions';
  }

  if (hasRequiredKeys(data, ['internal_strengths', 'external_resources'])) {
    return 'strengths_resources';
  }

  if (hasRequiredKeys(data, ['barriers']) && Array.isArray(data.barriers)) {
    return 'barriers_challenges';
  }

  // Visualization schemas
  if (hasRequiredKeys(data, ['title', 'description', 'dalle_prompt']) && hasRequiredKeys(data, ['symbolic_elements'])) {
    return 'scene_visualization';
  }

  if (hasRequiredKeys(data, ['metaphor_title', 'image_prompt', 'symbolic_meaning'])) {
    return 'visual_metaphor';
  }

  if (hasRequiredKeys(data, ['original_narrative', 'reframed_narrative', 'key_shifts'])) {
    return 'story_reframe';
  }

  if (hasRequiredKeys(data, ['hope_title', 'hope_description', 'image_prompt'])) {
    return 'hope_visualization';
  }

  if (hasRequiredKeys(data, ['journey_title', 'stages']) && Array.isArray(data.stages)) {
    return 'journey_map';
  }

  if (hasRequiredKeys(data, ['portrait_title', 'core_strengths', 'visual_prompt'])) {
    return 'character_strength';
  }

  if (hasRequiredKeys(data, ['timeline_title', 'timeline_entries']) && Array.isArray(data.timeline_entries)) {
    return 'timeline_visualization';
  }

  // Prompt schemas
  if (hasRequiredKeys(data, ['prompts']) && Array.isArray(data.prompts)) {
    // Disambiguate between different prompt types
    if (data.prompts.length > 0) {
      const firstPrompt = data.prompts[0];

      if (hasRequiredKeys(firstPrompt, ['prompt', 'focus'])) {
        return 'journaling_prompts';
      }

      if (hasRequiredKeys(firstPrompt, ['question', 'category'])) {
        return 'goal_setting_questions';
      }

      if (hasRequiredKeys(firstPrompt, ['prompt', 'technique'])) {
        return 'self_compassion_prompts';
      }

      if (hasRequiredKeys(firstPrompt, ['prompt', 'depth'])) {
        return 'gratitude_prompts';
      }
    }
  }

  if (hasRequiredKeys(data, ['assignments']) && Array.isArray(data.assignments)) {
    return 'homework_assignments';
  }

  if (hasRequiredKeys(data, ['questions']) && Array.isArray(data.questions)) {
    // Check if it's check-in questions (has type field)
    if (data.questions.length > 0 && hasRequiredKeys(data.questions[0], ['question', 'type'])) {
      return 'check_in_questions';
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
  // Try multiple regex patterns to handle various markdown code block formats
  const patterns = [
    // ```json\n{...}\n``` - with json language specifier
    /```json\s*\n([\s\S]+?)\n\s*```/,
    // ```\n{...}\n``` - without language specifier
    /```\s*\n([\s\S]+?)\n\s*```/,
    // ```json {...} ``` - all on one/few lines with json
    /```json\s*([\s\S]+?)\s*```/,
    // ``` {...} ``` - all on one/few lines without json
    /```\s*([\s\S]+?)\s*```/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      // Verify it looks like JSON (starts with { or [)
      if (extracted.startsWith('{') || extracted.startsWith('[')) {
        console.log('[extractJSONFromMarkdown] Extracted JSON, length:', extracted.length);
        console.log('[extractJSONFromMarkdown] First 200 chars:', extracted.substring(0, 200));
        return extracted;
      } else {
        console.warn('[extractJSONFromMarkdown] Matched but doesnt start with { or [. Starts with:', extracted.substring(0, 50));
      }
    }
  }

  console.warn('[extractJSONFromMarkdown] No JSON code block found. Content has ``` =', content.includes('```'));
  console.log('[extractJSONFromMarkdown] Content preview:', content.substring(0, 300));
  return content;
}

/**
 * Extract JSON object from mixed text content
 * Looks for {...} patterns and attempts to parse them
 * @param content - Content that may contain JSON objects mixed with text
 * @returns Extracted JSON string or null
 */
export function extractJSONFromMixedContent(content: string): string | null {
  // Find all potential JSON objects by looking for balanced braces
  // This regex finds content between outermost { and }
  const jsonObjectRegex = /\{[\s\S]*\}/;
  const match = content.match(jsonObjectRegex);

  if (match) {
    try {
      // Validate it's actually valid JSON by attempting to parse
      JSON.parse(match[0]);
      return match[0].trim();
    } catch {
      // Not valid JSON, try to find nested objects
      // Look for schemaType field which all our JSONs should have
      const schemaTypeRegex = /\{[\s\S]*"schemaType"[\s\S]*\}/;
      const schemaMatch = content.match(schemaTypeRegex);

      if (schemaMatch) {
        try {
          JSON.parse(schemaMatch[0]);
          return schemaMatch[0].trim();
        } catch {
          return null;
        }
      }
    }
  }

  return null;
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

      case 'therapeutic_scene_card':
        return (
          hasRequiredKeys(data, ['title', 'patient', 'scenes', 'status'])
          && Array.isArray(data.scenes)
          && data.scenes.every((scene: any) =>
            hasRequiredKeys(scene, ['sceneNumber', 'sections'])
            && hasRequiredKeys(scene.sections, ['patientQuote', 'meaning', 'imagePrompt', 'imageToScene']),
          )
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

      case 'video_references':
        return (
          hasRequiredKeys(data, ['videos'])
          && Array.isArray(data.videos)
          && data.videos.every((vid: any) => hasRequiredKeys(vid, ['title', 'prompt']))
        );

      case 'reflection_questions':
        return (
          hasRequiredKeys(data, ['patient_questions'])
          || hasRequiredKeys(data, ['reflection_questions'])
        );

      case 'therapeutic_note':
        return hasRequiredKeys(data, ['note_title', 'note_content']) || hasRequiredKeys(data, ['title', 'content']);

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
 * Check if content appears to contain malformed JSON that should be retried
 * @param content - Content to check
 * @returns true if content has JSON structure but parsing failed (should retry)
 */
export function shouldRetryForMalformedJSON(content: string): boolean {
  // Check if content has JSON code block markers
  if (!content.includes('```json') && !content.includes('```\n{')) {
    return false;
  }

  // Try to extract JSON
  const extracted = extractJSONFromMarkdown(content);
  if (extracted === content) {
    return false; // No extraction happened
  }

  // Try to parse - if it fails, we should retry
  try {
    JSON.parse(extracted);
    return false; // Parsing succeeded, no need to retry
  } catch {
    console.log('[shouldRetryForMalformedJSON] Malformed JSON detected - should retry');
    return true; // Parsing failed - this should be retried
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
    console.log('[detectAndExtractJSON] Direct parse succeeded', result.schemaType);
    return result;
  }

  // Try extracting from markdown code blocks
  const extracted = extractJSONFromMarkdown(content);
  if (extracted !== content) {
    console.log('[detectAndExtractJSON] Extracted from markdown, length:', extracted.length, 'starts with:', extracted.substring(0, 50));
    result = detectJSONSchema(extracted);
    if (result) {
      console.log('[detectAndExtractJSON] Markdown extraction succeeded', result.schemaType);
      return result;
    } else {
      console.warn('[detectAndExtractJSON] Markdown extraction failed - could not detect schema. First 100 chars:', extracted.substring(0, 100));
    }
  } else {
    // Log why markdown extraction was skipped
    const hasCodeBlock = content.includes('```');
    if (hasCodeBlock) {
      console.warn('[detectAndExtractJSON] Content has ``` but extraction returned same content. First 200 chars:', content.substring(0, 200));
    }
  }

  // Try extracting JSON from mixed content (text before/after JSON)
  const mixedExtracted = extractJSONFromMixedContent(content);
  if (mixedExtracted) {
    console.log('[detectAndExtractJSON] Extracted from mixed content');
    result = detectJSONSchema(mixedExtracted);
    if (result) {
      console.log('[detectAndExtractJSON] Mixed content extraction succeeded', result.schemaType);
      return result;
    }
  }

  console.warn('[detectAndExtractJSON] All extraction methods failed for content length:', content.length);
  return null;
}
