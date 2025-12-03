/**
 * Property Name Options
 * Complete list of all 127 unique property names from 35 JSON schemas in the database
 * Organized by category for easy discovery
 */

export interface PropertyNameOption {
  value: string;
  label: string;
  category: string;
  description: string;
  usageCount: number; // How many schemas use this property
}

export interface PropertyCategory {
  id: string;
  label: string;
  icon: string;
}

export const PROPERTY_CATEGORIES: PropertyCategory[] = [
  { id: 'identification', label: 'Identification', icon: '🆔' },
  { id: 'content', label: 'Content & Text', icon: '📝' },
  { id: 'therapeutic', label: 'Therapeutic', icon: '💊' },
  { id: 'visual', label: 'Visual & Images', icon: '🖼️' },
  { id: 'quotes', label: 'Quotes & Sources', icon: '💬' },
  { id: 'questions', label: 'Questions & Reflections', icon: '❓' },
  { id: 'music', label: 'Music & Audio', icon: '🎵' },
  { id: 'scenes', label: 'Scenes & Structure', icon: '🎬' },
  { id: 'ui', label: 'UI & Interaction', icon: '🎨' },
  { id: 'metadata', label: 'Metadata & Organization', icon: '🏷️' },
  { id: 'goals', label: 'Goals & Intentions', icon: '🎯' },
  { id: 'strengths', label: 'Strengths & Resources', icon: '💪' },
  { id: 'metaphors', label: 'Metaphors & Symbols', icon: '🔮' },
];

export const PROPERTY_NAME_OPTIONS: PropertyNameOption[] = [
  // ============================================
  // IDENTIFICATION (5 properties)
  // ============================================
  { value: 'schemaType', label: 'schemaType', category: 'identification', description: 'Schema type identifier (REQUIRED in all schemas)', usageCount: 35 },
  { value: 'category', label: 'category', category: 'identification', description: 'Category classification', usageCount: 3 },
  { value: 'type', label: 'type', category: 'identification', description: 'Type classification', usageCount: 2 },
  { value: 'question_type', label: 'question_type', category: 'identification', description: 'Type of question', usageCount: 1 },
  { value: 'practice_type', label: 'practice_type', category: 'identification', description: 'Type of practice', usageCount: 1 },

  // ============================================
  // CONTENT & TEXT (15 properties)
  // ============================================
  { value: 'title', label: 'title', category: 'content', description: 'Title or heading', usageCount: 10 },
  { value: 'description', label: 'description', category: 'content', description: 'Descriptive text', usageCount: 8 },
  { value: 'content', label: 'content', category: 'content', description: 'Main content text', usageCount: 5 },
  { value: 'prompt', label: 'prompt', category: 'content', description: 'AI generation prompt', usageCount: 6 },
  { value: 'text', label: 'text', category: 'content', description: 'General text field', usageCount: 3 },
  { value: 'note_content', label: 'note_content', category: 'content', description: 'Note content text', usageCount: 2 },
  { value: 'note_title', label: 'note_title', category: 'content', description: 'Note title', usageCount: 2 },
  { value: 'scene_description', label: 'scene_description', category: 'content', description: 'Description of scene', usageCount: 1 },
  { value: 'future_description', label: 'future_description', category: 'content', description: 'Description of future state', usageCount: 1 },
  { value: 'music_description', label: 'music_description', category: 'content', description: 'Music description', usageCount: 1 },
  { value: 'narrative', label: 'narrative', category: 'content', description: 'Narrative text', usageCount: 2 },
  { value: 'narrative_arc', label: 'narrative_arc', category: 'content', description: 'Narrative arc description', usageCount: 1 },
  { value: 'meaning', label: 'meaning', category: 'content', description: 'Meaning or significance', usageCount: 2 },
  { value: 'context', label: 'context', category: 'content', description: 'Contextual information', usageCount: 2 },
  { value: 'guidance', label: 'guidance', category: 'content', description: 'Guidance or instructions', usageCount: 3 },

  // ============================================
  // THERAPEUTIC (17 properties)
  // ============================================
  { value: 'therapeutic_rationale', label: 'therapeutic_rationale', category: 'therapeutic', description: 'Therapeutic reasoning', usageCount: 2 },
  { value: 'therapeutic_purpose', label: 'therapeutic_purpose', category: 'therapeutic', description: 'Therapeutic purpose', usageCount: 3 },
  { value: 'therapeutic_objective', label: 'therapeutic_objective', category: 'therapeutic', description: 'Therapeutic objective', usageCount: 1 },
  { value: 'therapeutic_significance', label: 'therapeutic_significance', category: 'therapeutic', description: 'Therapeutic significance', usageCount: 1 },
  { value: 'keyInsights', label: 'keyInsights', category: 'therapeutic', description: 'Key insights (camelCase)', usageCount: 2 },
  { value: 'key_themes', label: 'key_themes', category: 'therapeutic', description: 'Key themes (snake_case)', usageCount: 3 },
  { value: 'actionItems', label: 'actionItems', category: 'therapeutic', description: 'Action items (camelCase)', usageCount: 2 },
  { value: 'action_steps', label: 'action_steps', category: 'therapeutic', description: 'Action steps', usageCount: 1 },
  { value: 'rationale', label: 'rationale', category: 'therapeutic', description: 'General rationale or reasoning', usageCount: 5 },
  { value: 'healing_support', label: 'healing_support', category: 'therapeutic', description: 'Healing support information', usageCount: 1 },
  { value: 'connection_to_goals', label: 'connection_to_goals', category: 'therapeutic', description: 'Connection to therapeutic goals', usageCount: 1 },
  { value: 'connection_to_narrative', label: 'connection_to_narrative', category: 'therapeutic', description: 'Connection to patient narrative', usageCount: 1 },
  { value: 'build_on', label: 'build_on', category: 'therapeutic', description: 'What to build on', usageCount: 1 },
  { value: 'significance', label: 'significance', category: 'therapeutic', description: 'Significance or importance', usageCount: 3 },
  { value: 'evidence', label: 'evidence', category: 'therapeutic', description: 'Supporting evidence', usageCount: 2 },
  { value: 'supporting_evidence', label: 'supporting_evidence', category: 'therapeutic', description: 'Supporting evidence details', usageCount: 1 },
  { value: 'behavioral_influence', label: 'behavioral_influence', category: 'therapeutic', description: 'Behavioral influence', usageCount: 1 },

  // ============================================
  // VISUAL & IMAGES (13 properties)
  // ============================================
  { value: 'dalle_prompt', label: 'dalle_prompt', category: 'visual', description: 'DALL-E generation prompt', usageCount: 7 },
  { value: 'image_prompt', label: 'image_prompt', category: 'visual', description: 'Image generation prompt', usageCount: 3 },
  { value: 'reference_images', label: 'reference_images', category: 'visual', description: 'Array of reference images', usageCount: 1 },
  { value: 'images', label: 'images', category: 'visual', description: 'Array of images', usageCount: 1 },
  { value: 'animation_instructions', label: 'animation_instructions', category: 'visual', description: 'Animation instructions', usageCount: 1 },
  { value: 'stage_name', label: 'stage_name', category: 'visual', description: 'Stage name in sequence', usageCount: 1 },
  { value: 'visual_representation', label: 'visual_representation', category: 'visual', description: 'Visual representation description', usageCount: 1 },
  { value: 'visual_concept', label: 'visual_concept', category: 'visual', description: 'Visual concept', usageCount: 1 },
  { value: 'symbolic_elements', label: 'symbolic_elements', category: 'visual', description: 'Symbolic visual elements', usageCount: 1 },
  { value: 'style', label: 'style', category: 'visual', description: 'Visual or artistic style', usageCount: 2 },
  { value: 'affirmations', label: 'affirmations', category: 'visual', description: 'Visual affirmations', usageCount: 1 },
  { value: 'pathway_steps', label: 'pathway_steps', category: 'visual', description: 'Visual pathway steps', usageCount: 1 },
  { value: 'journey_metaphor', label: 'journey_metaphor', category: 'visual', description: 'Journey metaphor', usageCount: 1 },

  // ============================================
  // QUOTES & SOURCES (12 properties)
  // ============================================
  { value: 'quote', label: 'quote', category: 'quotes', description: 'Quote text', usageCount: 4 },
  { value: 'quote_text', label: 'quote_text', category: 'quotes', description: 'Exact quote text', usageCount: 2 },
  { value: 'key_quote', label: 'key_quote', category: 'quotes', description: 'Key quote from transcript', usageCount: 1 },
  { value: 'patient_quote_anchor', label: 'patient_quote_anchor', category: 'quotes', description: 'Patient quote anchor', usageCount: 1 },
  { value: 'source_quote', label: 'source_quote', category: 'quotes', description: 'Source quote', usageCount: 2 },
  { value: 'source_quotes', label: 'source_quotes', category: 'quotes', description: 'Array of source quotes', usageCount: 2 },
  { value: 'extracted_quotes', label: 'extracted_quotes', category: 'quotes', description: 'Array of extracted quotes', usageCount: 1 },
  { value: 'supporting_quotes', label: 'supporting_quotes', category: 'quotes', description: 'Supporting quotes', usageCount: 1 },
  { value: 'speaker', label: 'speaker', category: 'quotes', description: 'Who said the quote', usageCount: 1 },
  { value: 'exact_language', label: 'exact_language', category: 'quotes', description: 'Exact language used', usageCount: 1 },
  { value: 'exploration_suggestions', label: 'exploration_suggestions', category: 'quotes', description: 'Exploration suggestions', usageCount: 1 },
  { value: 'alternative_narratives', label: 'alternative_narratives', category: 'quotes', description: 'Alternative narrative framings', usageCount: 1 },

  // ============================================
  // QUESTIONS & REFLECTIONS (11 properties)
  // ============================================
  { value: 'question', label: 'question', category: 'questions', description: 'Question text', usageCount: 5 },
  { value: 'questions', label: 'questions', category: 'questions', description: 'Array of questions', usageCount: 4 },
  { value: 'patient_reflection_questions', label: 'patient_reflection_questions', category: 'questions', description: 'Patient reflection questions', usageCount: 1 },
  { value: 'group_reflection_questions', label: 'group_reflection_questions', category: 'questions', description: 'Group reflection questions', usageCount: 1 },
  { value: 'exploration_questions', label: 'exploration_questions', category: 'questions', description: 'Exploration questions', usageCount: 1 },
  { value: 'prompts', label: 'prompts', category: 'questions', description: 'Array of prompts', usageCount: 3 },
  { value: 'placement', label: 'placement', category: 'questions', description: 'Placement in workflow', usageCount: 1 },
  { value: 'purpose', label: 'purpose', category: 'questions', description: 'Purpose of question', usageCount: 1 },
  { value: 'response_format', label: 'response_format', category: 'questions', description: 'Expected response format', usageCount: 1 },
  { value: 'tracking_area', label: 'tracking_area', category: 'questions', description: 'What area to track', usageCount: 1 },
  { value: 'focus_area', label: 'focus_area', category: 'questions', description: 'Focus area', usageCount: 1 },

  // ============================================
  // MUSIC & AUDIO (16 properties)
  // ============================================
  { value: 'music', label: 'music', category: 'music', description: 'Music object', usageCount: 1 },
  { value: 'mood', label: 'mood', category: 'music', description: 'Emotional mood', usageCount: 4 },
  { value: 'genre', label: 'genre', category: 'music', description: 'Music genre', usageCount: 3 },
  { value: 'genre_tags', label: 'genre_tags', category: 'music', description: 'Genre tags (array)', usageCount: 2 },
  { value: 'duration_seconds', label: 'duration_seconds', category: 'music', description: 'Duration in seconds', usageCount: 1 },
  { value: 'segment_timing', label: 'segment_timing', category: 'music', description: 'Timing for each segment', usageCount: 1 },
  { value: 'fade_out', label: 'fade_out', category: 'music', description: 'Fade out at end (boolean)', usageCount: 1 },
  { value: 'instrument_focus', label: 'instrument_focus', category: 'music', description: 'Instruments to focus on', usageCount: 1 },
  { value: 'progression_note', label: 'progression_note', category: 'music', description: 'Musical progression note', usageCount: 1 },
  { value: 'suggested_lyrics', label: 'suggested_lyrics', category: 'music', description: 'Suggested lyrics for song', usageCount: 1 },
  { value: 'style_prompt', label: 'style_prompt', category: 'music', description: 'AI music generation style prompt', usageCount: 2 },
  { value: 'instrumental_option', label: 'instrumental_option', category: 'music', description: 'Instrumental music option (object)', usageCount: 1 },
  { value: 'lyrical_option', label: 'lyrical_option', category: 'music', description: 'Lyrical song option (object)', usageCount: 1 },
  { value: 'audio_url', label: 'audio_url', category: 'music', description: 'Audio file URL', usageCount: 0 },
  { value: 'video_url', label: 'video_url', category: 'music', description: 'Video file URL', usageCount: 0 },
  { value: 'media_url', label: 'media_url', category: 'music', description: 'Media file URL', usageCount: 0 },

  // ============================================
  // SCENES & STRUCTURE (14 properties)
  // ============================================
  { value: 'scenes', label: 'scenes', category: 'scenes', description: 'Array of scenes', usageCount: 1 },
  { value: 'scene_title', label: 'scene_title', category: 'scenes', description: 'Scene title', usageCount: 1 },
  { value: 'scene_description', label: 'scene_description', category: 'scenes', description: 'Scene description', usageCount: 1 },
  { value: 'scene_focus_instruction', label: 'scene_focus_instruction', category: 'scenes', description: 'Scene creation instruction', usageCount: 1 },
  { value: 'video_introduction', label: 'video_introduction', category: 'scenes', description: 'Video introduction text (patient-facing)', usageCount: 1 },
  { value: 'assembly_steps', label: 'assembly_steps', category: 'scenes', description: 'Assembly steps (array)', usageCount: 1 },
  { value: 'potential_scenes_by_participant', label: 'potential_scenes_by_participant', category: 'scenes', description: 'Scenes grouped by participant', usageCount: 1 },
  { value: 'for_patient_name', label: 'for_patient_name', category: 'scenes', description: 'Patient name these scenes are for', usageCount: 1 },
  { value: 'key_moments', label: 'key_moments', category: 'scenes', description: 'Array of key moments', usageCount: 2 },
  { value: 'moments', label: 'moments', category: 'scenes', description: 'Array of moments', usageCount: 1 },
  { value: 'milestones', label: 'milestones', category: 'scenes', description: 'Array of milestones', usageCount: 1 },
  { value: 'event', label: 'event', category: 'scenes', description: 'Event description', usageCount: 1 },
  { value: 'date', label: 'date', category: 'scenes', description: 'Date of event', usageCount: 1 },
  { value: 'story_page_potential', label: 'story_page_potential', category: 'scenes', description: 'Potential for story page', usageCount: 1 },

  // ============================================
  // UI & INTERACTION (8 properties)
  // ============================================
  { value: 'buttons', label: 'buttons', category: 'ui', description: 'Array of action buttons', usageCount: 1 },
  { value: 'label', label: 'label', category: 'ui', description: 'Button label text', usageCount: 1 },
  { value: 'action', label: 'action', category: 'ui', description: 'Button action handler', usageCount: 2 },
  { value: 'icon', label: 'icon', category: 'ui', description: 'Icon name (lucide-react)', usageCount: 1 },
  { value: 'data_key', label: 'data_key', category: 'ui', description: 'Data key reference', usageCount: 1 },
  { value: 'group', label: 'group', category: 'ui', description: 'Button group', usageCount: 1 },
  { value: 'color', label: 'color', category: 'ui', description: 'Color value', usageCount: 0 },
  { value: 'size', label: 'size', category: 'ui', description: 'Size value', usageCount: 0 },

  // ============================================
  // METADATA & ORGANIZATION (5 properties)
  // ============================================
  { value: 'tags', label: 'tags', category: 'metadata', description: 'Tags for categorization (array)', usageCount: 7 },
  { value: 'id', label: 'id', category: 'metadata', description: 'Unique identifier', usageCount: 0 },
  { value: 'name', label: 'name', category: 'metadata', description: 'Name field', usageCount: 0 },
  { value: 'created_at', label: 'created_at', category: 'metadata', description: 'Creation timestamp', usageCount: 0 },
  { value: 'updated_at', label: 'updated_at', category: 'metadata', description: 'Update timestamp', usageCount: 0 },

  // ============================================
  // GOALS & INTENTIONS (7 properties)
  // ============================================
  { value: 'goal', label: 'goal', category: 'goals', description: 'Goal description', usageCount: 2 },
  { value: 'goals', label: 'goals', category: 'goals', description: 'Array of goals', usageCount: 1 },
  { value: 'barriers', label: 'barriers', category: 'goals', description: 'Barriers to goal', usageCount: 2 },
  { value: 'motivation_level', label: 'motivation_level', category: 'goals', description: 'Motivation level', usageCount: 1 },
  { value: 'timeframe', label: 'timeframe', category: 'goals', description: 'Goal timeframe', usageCount: 1 },
  { value: 'success_criteria', label: 'success_criteria', category: 'goals', description: 'Success criteria', usageCount: 1 },
  { value: 'assignment', label: 'assignment', category: 'goals', description: 'Homework assignment', usageCount: 1 },

  // ============================================
  // STRENGTHS & RESOURCES (8 properties)
  // ============================================
  { value: 'strengths', label: 'strengths', category: 'strengths', description: 'Array of strengths', usageCount: 2 },
  { value: 'strength_name', label: 'strength_name', category: 'strengths', description: 'Name of strength', usageCount: 1 },
  { value: 'resources', label: 'resources', category: 'strengths', description: 'Available resources', usageCount: 2 },
  { value: 'resource', label: 'resource', category: 'strengths', description: 'Resource description', usageCount: 1 },
  { value: 'leverage_opportunities', label: 'leverage_opportunities', category: 'strengths', description: 'Leverage opportunities', usageCount: 1 },
  { value: 'leverage_suggestions', label: 'leverage_suggestions', category: 'strengths', description: 'Suggestions for leveraging', usageCount: 1 },
  { value: 'demonstration', label: 'demonstration', category: 'strengths', description: 'How strength was demonstrated', usageCount: 1 },
  { value: 'character_strength', label: 'character_strength', category: 'strengths', description: 'Character strength', usageCount: 1 },

  // ============================================
  // METAPHORS & SYMBOLS (6 properties)
  // ============================================
  { value: 'metaphors', label: 'metaphors', category: 'metaphors', description: 'Array of metaphors', usageCount: 2 },
  { value: 'symbolic_meaning', label: 'symbolic_meaning', category: 'metaphors', description: 'Symbolic meaning', usageCount: 2 },
  { value: 'visual_metaphor', label: 'visual_metaphor', category: 'metaphors', description: 'Visual metaphor', usageCount: 1 },
  { value: 'current_narrative', label: 'current_narrative', category: 'metaphors', description: 'Current narrative framing', usageCount: 1 },
  { value: 'values', label: 'values', category: 'metaphors', description: 'Values (array)', usageCount: 1 },
  { value: 'value_or_belief', label: 'value_or_belief', category: 'metaphors', description: 'Value or belief', usageCount: 1 },
];

/**
 * Get property options filtered by category
 */
export function getPropertiesByCategory(categoryId: string): PropertyNameOption[] {
  return PROPERTY_NAME_OPTIONS.filter((opt) => opt.category === categoryId).sort(
    (a, b) => b.usageCount - a.usageCount,
  );
}

/**
 * Get most popular properties (used in 3+ schemas)
 */
export function getPopularProperties(): PropertyNameOption[] {
  return PROPERTY_NAME_OPTIONS.filter((opt) => opt.usageCount >= 3).sort(
    (a, b) => b.usageCount - a.usageCount,
  );
}

/**
 * Search properties by name or description
 */
export function searchProperties(query: string): PropertyNameOption[] {
  const lowerQuery = query.toLowerCase();
  return PROPERTY_NAME_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(lowerQuery) ||
      opt.description.toLowerCase().includes(lowerQuery),
  ).sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Get suggested properties based on type and context
 */
export function getSuggestedProperties(
  propertyType: string,
  siblingNames: string[],
): PropertyNameOption[] {
  // Type-based suggestions
  if (propertyType === 'array') {
    return PROPERTY_NAME_OPTIONS.filter((opt) =>
      ['tags', 'questions', 'scenes', 'items', 'steps', 'prompts', 'images'].includes(opt.value),
    );
  }

  if (propertyType === 'object') {
    return PROPERTY_NAME_OPTIONS.filter((opt) =>
      ['music', 'metadata', 'settings', 'config', 'options'].includes(opt.value),
    );
  }

  // Context-based suggestions
  if (siblingNames.includes('title')) {
    return PROPERTY_NAME_OPTIONS.filter((opt) =>
      ['description', 'content', 'tags', 'category'].includes(opt.value),
    );
  }

  if (siblingNames.includes('prompt')) {
    return PROPERTY_NAME_OPTIONS.filter((opt) =>
      ['style', 'mood', 'genre', 'description'].includes(opt.value),
    );
  }

  // Default: return popular properties
  return getPopularProperties().slice(0, 10);
}
