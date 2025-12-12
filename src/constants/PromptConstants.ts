import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  Target,
  Lightbulb,
  Heart,
  Brain,
  Compass,
  BookOpen,
  MessageCircle,
  Image,
  Video,
  Music,
  FileText,
  Zap,
  Star,
  TrendingUp,
  Users,
  Shield,
  Gem,
  Map,
  Clock,
  CheckCircle,
  Award,
  Palette,
  PenTool,
  Quote,
  Search,
  List,
  Activity,
  BarChart,
  Flag,
  Layers,
} from 'lucide-react';

/**
 * Prompt Categories matching the database schema
 * These are the actual categories used in seed data
 */
export const PROMPT_CATEGORIES = [
  {
    id: 'all',
    label: 'All Prompts',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-500',
    hoverClass: 'hover:bg-gray-200',
    description: 'All available prompts',
  },
  {
    id: 'analysis',
    label: 'Analysis',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-500',
    hoverClass: 'hover:bg-blue-200',
    description: 'Therapeutic analysis and assessment prompts',
  },
  {
    id: 'creative',
    label: 'Creative',
    color: 'purple',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-500',
    hoverClass: 'hover:bg-purple-200',
    description: 'Media generation and creative content prompts',
  },
  {
    id: 'extraction',
    label: 'Extraction',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-500',
    hoverClass: 'hover:bg-green-200',
    description: 'Extract insights, quotes, and key elements',
  },
  {
    id: 'reflection',
    label: 'Reflection',
    color: 'pink',
    bgClass: 'bg-pink-100',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-500',
    hoverClass: 'hover:bg-pink-200',
    description: 'Patient reflection and journaling prompts',
  },
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number]['id'];

/**
 * Icon mapping for prompt icons
 * Maps database icon field values to Lucide React components
 */
export const PROMPT_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  target: Target,
  lightbulb: Lightbulb,
  heart: Heart,
  brain: Brain,
  compass: Compass,
  'book-open': BookOpen,
  'message-circle': MessageCircle,
  image: Image,
  video: Video,
  music: Music,
  'file-text': FileText,
  zap: Zap,
  star: Star,
  'trending-up': TrendingUp,
  users: Users,
  shield: Shield,
  gem: Gem,
  map: Map,
  clock: Clock,
  'check-circle': CheckCircle,
  award: Award,
  palette: Palette,
  'pen-tool': PenTool,
  quote: Quote,
  search: Search,
  list: List,
  activity: Activity,
  'bar-chart': BarChart,
  flag: Flag,
  layers: Layers,
};

/**
 * Get Lucide icon component for a prompt
 */
export function getPromptIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Sparkles; // default icon
  return PROMPT_ICONS[iconName] || Sparkles;
}

/**
 * Get category metadata by category ID
 */
export function getCategoryData(categoryId: string) {
  return PROMPT_CATEGORIES.find((cat) => cat.id === categoryId) || PROMPT_CATEGORIES[0];
}

/**
 * Get static Tailwind classes for a category
 * Returns complete class strings to avoid dynamic class generation issues
 */
export function getCategoryClasses(categoryId: string) {
  const category = getCategoryData(categoryId);
  return {
    bg: category.bgClass,
    text: category.textClass,
    border: category.borderClass,
    hover: category.hoverClass,
    // Combined class string for badges
    badge: `${category.bgClass} ${category.textClass}`,
    // Combined class string for active buttons
    activeButton: `${category.bgClass} ${category.textClass} border-2 ${category.borderClass}`,
    // Combined class string for inactive buttons
    inactiveButton: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  };
}

/**
 * Output type metadata with icons and labels
 */
export const OUTPUT_TYPES = {
  text: {
    label: 'Text',
    icon: '📝',
    description: 'Plain text output',
  },
  json: {
    label: 'JSON',
    icon: '📊',
    description: 'Structured JSON output',
  },
} as const;

/**
 * JSON Schema type labels for display
 * Maps internal schema type names to user-friendly labels
 */
export const SCHEMA_TYPE_LABELS: Record<string, string> = {
  therapeutic_note: 'Therapeutic Note',
  scene_card: 'Scene Card',
  scene_suggestions: 'Scene Suggestions',
  music_generation: 'Music Options',
  image_references: 'Image References',
  video_references: 'Video References',
  reflection_questions: 'Reflection Questions',
  quote_extraction: 'Quote Extraction',
  visual_metaphor: 'Visual Metaphor',
  story_reframe: 'Story Reframe',
  hope_visualization: 'Hope Visualization',
  journey_map: 'Journey Map',
  character_strength: 'Character Strength',
  timeline_visualization: 'Timeline',
  metaphor_extraction: 'Metaphor Extraction',
  key_moments: 'Key Moments',
  values_beliefs: 'Values & Beliefs',
  goals_intentions: 'Goals & Intentions',
  strengths_resources: 'Strengths & Resources',
  barriers_challenges: 'Barriers & Challenges',
  journaling_prompts: 'Journaling Prompts',
  goal_setting_questions: 'Goal Setting',
  self_compassion_prompts: 'Self-Compassion',
  gratitude_prompts: 'Gratitude Prompts',
  homework_assignments: 'Homework',
  check_in_questions: 'Check-In Questions',
};

/**
 * Extract JSON schema type from jsonSchema object
 */
export function getSchemaType(jsonSchema: any): string | null {
  if (!jsonSchema || typeof jsonSchema !== 'object') return null;

  // Check if there's a title field
  if (jsonSchema.title) {
    return jsonSchema.title;
  }

  // Check properties for schema type hints
  if (jsonSchema.properties) {
    const props = Object.keys(jsonSchema.properties);

    // Common schema type detection patterns
    if (props.includes('scenes') || props.includes('sceneTitle')) return 'scene_card';
    if (props.includes('suggestions') && props.includes('sceneType')) return 'scene_suggestions';
    if (props.includes('musicSuggestions')) return 'music_generation';
    if (props.includes('imagePrompts')) return 'image_references';
    if (props.includes('videoScenes')) return 'video_references';
    if (props.includes('questions') && props.includes('reflectionType')) return 'reflection_questions';
    if (props.includes('quotes')) return 'quote_extraction';
    if (props.includes('metaphor')) return 'visual_metaphor';
    if (props.includes('reframe')) return 'story_reframe';
    if (props.includes('visualization')) return 'hope_visualization';
    if (props.includes('journeyStages')) return 'journey_map';
    if (props.includes('strengths')) return 'character_strength';
    if (props.includes('timeline')) return 'timeline_visualization';
    if (props.includes('metaphors')) return 'metaphor_extraction';
    if (props.includes('moments')) return 'key_moments';
    if (props.includes('values')) return 'values_beliefs';
    if (props.includes('goals')) return 'goals_intentions';
    if (props.includes('resources')) return 'strengths_resources';
    if (props.includes('barriers')) return 'barriers_challenges';
  }

  return null;
}

/**
 * Get user-friendly label for JSON schema type
 */
export function getSchemaTypeLabel(jsonSchema: any): string | null {
  const schemaType = getSchemaType(jsonSchema);
  if (!schemaType) return null;
  return SCHEMA_TYPE_LABELS[schemaType] || schemaType;
}
