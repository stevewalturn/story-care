/**
 * Prompt Builder Block Definitions
 *
 * This file contains all block definitions for the drag-and-drop prompt builder.
 * Blocks are divided into two categories:
 * - UI Blocks: General purpose layout and content blocks
 * - AI Blocks: Content generation blocks tied to schema types
 */

import type { LucideIcon } from 'lucide-react';
import {
  Columns,
  FileText,
  Film,
  Heading,
  HelpCircle,
  Image,
  MessageSquareQuote,
  Minus,
  MousePointer,
  Music,
  Quote,
  Space,
  Sparkles,
  Type,
  Video,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type BlockCategory = 'ui' | 'ai';

export type BlockFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'number'
  | 'url'
  | 'boolean'
  | 'color'
  | 'image';

export type BlockField = {
  id: string;
  label: string;
  type: BlockFieldType;
  required?: boolean;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  // AI instruction for generating this field's content
  fieldPrompt?: string;
};

export type BlockDefinition = {
  id: string;
  label: string;
  icon: LucideIcon;
  category: BlockCategory;
  description: string;
  defaultValues: Record<string, any>;
  fields: BlockField[];
  schemaType?: string; // For AI blocks - maps to seed-system-prompts schema types
  hasAction?: boolean; // Shows action button like "Generate Image"
  actionLabel?: string; // Label for the action button
  // NEW: Full system prompt from seed-system-prompts.ts (editable by user)
  defaultSystemPrompt?: string;
  // NEW: JSON schema defining expected output structure
  jsonSchema?: object;
};

export type BlockInstance = {
  id: string; // Unique instance ID (e.g., "block_1234567890_abc123")
  blockType: string; // Block definition ID
  values: Record<string, any>;
  order: number;
  // Custom system prompt (overrides defaultSystemPrompt from definition)
  customSystemPrompt?: string;
};

// ============================================================================
// UI Block Definitions
// ============================================================================

const TEXT_BLOCK: BlockDefinition = {
  id: 'text',
  label: 'Text',
  icon: Type,
  category: 'ui',
  description: 'Rich text content with markdown support',
  defaultValues: {
    content: '',
    style: 'paragraph',
  },
  fields: [
    {
      id: 'content',
      label: 'Content',
      type: 'textarea',
      required: true,
      placeholder: 'Enter your text content here...',
      helpText: 'Supports markdown formatting',
      validation: { maxLength: 5000 },
    },
    {
      id: 'style',
      label: 'Style',
      type: 'select',
      defaultValue: 'paragraph',
      options: [
        { label: 'Paragraph', value: 'paragraph' },
        { label: 'Heading 1', value: 'h1' },
        { label: 'Heading 2', value: 'h2' },
        { label: 'Heading 3', value: 'h3' },
        { label: 'Caption', value: 'caption' },
      ],
    },
  ],
};

const IMAGE_BLOCK: BlockDefinition = {
  id: 'image',
  label: 'Image',
  icon: Image,
  category: 'ui',
  description: 'Display an image from library or URL',
  defaultValues: {
    source: 'url',
    url: '',
    alt: '',
    width: 'full',
  },
  fields: [
    {
      id: 'source',
      label: 'Source',
      type: 'select',
      defaultValue: 'url',
      options: [
        { label: 'From URL', value: 'url' },
        { label: 'From Library', value: 'library' },
      ],
    },
    {
      id: 'url',
      label: 'Image URL',
      type: 'url',
      placeholder: 'https://example.com/image.jpg',
    },
    {
      id: 'alt',
      label: 'Alt Text',
      type: 'text',
      placeholder: 'Describe the image...',
      helpText: 'Important for accessibility',
    },
    {
      id: 'width',
      label: 'Width',
      type: 'select',
      defaultValue: 'full',
      options: [
        { label: 'Full Width', value: 'full' },
        { label: 'Large', value: 'large' },
        { label: 'Medium', value: 'medium' },
        { label: 'Small', value: 'small' },
      ],
    },
  ],
};

const BUTTON_BLOCK: BlockDefinition = {
  id: 'button',
  label: 'Button',
  icon: MousePointer,
  category: 'ui',
  description: 'Clickable button with redirect URL',
  defaultValues: {
    label: 'Click me',
    url: '',
    style: 'primary',
    openInNewTab: false,
  },
  fields: [
    {
      id: 'label',
      label: 'Button Text',
      type: 'text',
      required: true,
      placeholder: 'Click me',
      validation: { maxLength: 100 },
    },
    {
      id: 'url',
      label: 'Redirect URL',
      type: 'url',
      required: true,
      placeholder: 'https://example.com',
    },
    {
      id: 'style',
      label: 'Style',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    {
      id: 'openInNewTab',
      label: 'Open in new tab',
      type: 'boolean',
      defaultValue: false,
    },
  ],
};

const HEADER_BLOCK: BlockDefinition = {
  id: 'header',
  label: 'Header',
  icon: Heading,
  category: 'ui',
  description: 'Section header with styling',
  defaultValues: {
    text: '',
    level: 'h2',
    alignment: 'left',
  },
  fields: [
    {
      id: 'text',
      label: 'Header Text',
      type: 'text',
      required: true,
      placeholder: 'Section Title',
      validation: { maxLength: 200 },
    },
    {
      id: 'level',
      label: 'Level',
      type: 'select',
      defaultValue: 'h2',
      options: [
        { label: 'H1 - Large', value: 'h1' },
        { label: 'H2 - Medium', value: 'h2' },
        { label: 'H3 - Small', value: 'h3' },
      ],
    },
    {
      id: 'alignment',
      label: 'Alignment',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
  ],
};

const DIVIDER_BLOCK: BlockDefinition = {
  id: 'divider',
  label: 'Divider',
  icon: Minus,
  category: 'ui',
  description: 'Horizontal line separator',
  defaultValues: {
    style: 'solid',
    color: '#e5e7eb',
  },
  fields: [
    {
      id: 'style',
      label: 'Style',
      type: 'select',
      defaultValue: 'solid',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' },
      ],
    },
    {
      id: 'color',
      label: 'Color',
      type: 'color',
      defaultValue: '#e5e7eb',
    },
  ],
};

const SPACER_BLOCK: BlockDefinition = {
  id: 'spacer',
  label: 'Spacer',
  icon: Space,
  category: 'ui',
  description: 'Vertical spacing between blocks',
  defaultValues: {
    height: 'medium',
  },
  fields: [
    {
      id: 'height',
      label: 'Height',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Small (16px)', value: 'small' },
        { label: 'Medium (32px)', value: 'medium' },
        { label: 'Large (48px)', value: 'large' },
        { label: 'Extra Large (64px)', value: 'xlarge' },
      ],
    },
  ],
};

const SPLIT_BLOCK: BlockDefinition = {
  id: 'split',
  label: 'Split',
  icon: Columns,
  category: 'ui',
  description: 'Two-column layout container',
  defaultValues: {
    ratio: '50-50',
    gap: 'medium',
    leftContent: '',
    rightContent: '',
  },
  fields: [
    {
      id: 'ratio',
      label: 'Column Ratio',
      type: 'select',
      defaultValue: '50-50',
      options: [
        { label: '50% / 50%', value: '50-50' },
        { label: '33% / 67%', value: '33-67' },
        { label: '67% / 33%', value: '67-33' },
        { label: '25% / 75%', value: '25-75' },
        { label: '75% / 25%', value: '75-25' },
      ],
    },
    {
      id: 'gap',
      label: 'Gap',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
    },
    {
      id: 'leftContent',
      label: 'Left Column Content',
      type: 'textarea',
      placeholder: 'Content for left column...',
    },
    {
      id: 'rightContent',
      label: 'Right Column Content',
      type: 'textarea',
      placeholder: 'Content for right column...',
    },
  ],
};

const QUOTE_BLOCK: BlockDefinition = {
  id: 'quote',
  label: 'Quote',
  icon: Quote,
  category: 'ui',
  description: 'Styled quote block',
  defaultValues: {
    text: '',
    author: '',
    style: 'default',
  },
  fields: [
    {
      id: 'text',
      label: 'Quote Text',
      type: 'textarea',
      required: true,
      placeholder: 'Enter the quote...',
      validation: { maxLength: 1000 },
    },
    {
      id: 'author',
      label: 'Author',
      type: 'text',
      placeholder: 'Quote attribution',
    },
    {
      id: 'style',
      label: 'Style',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Highlighted', value: 'highlighted' },
        { label: 'Minimal', value: 'minimal' },
      ],
    },
  ],
};

// ============================================================================
// AI Block Definitions
// ============================================================================

const GENERATE_IMAGE_BLOCK: BlockDefinition = {
  id: 'generate_image',
  label: 'Generate Image',
  icon: Sparkles,
  category: 'ai',
  description: 'AI image generation prompt',
  schemaType: 'image_references',
  hasAction: true,
  actionLabel: 'Generate Image',
  defaultSystemPrompt: `Generate image suggestions based on transcript themes and metaphors.

Analyze the selected text for:
1. Natural metaphors the patient uses
2. Emotional states described
3. Relationships and connections
4. Transformation or change themes
5. Settings or environments mentioned

Suggest 3-5 image concepts with detailed generation prompts.

**IMPORTANT**: The "prompt" field must contain a complete, detailed image generation prompt suitable for DALL-E or Flux models. This should be 2-3 sentences describing:
- Visual composition and framing
- Lighting, colors, and atmosphere
- Specific elements and their arrangement
- Artistic style and mood

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.

Required JSON fields:
- schemaType: "image_references"
- images: array of objects, each with:
  - title: string
  - prompt: DETAILED 2-3 sentence image generation prompt with composition, lighting, colors, elements, style
  - style: string (photorealistic, artistic, abstract, etc.)
  - therapeutic_purpose: string
  - source_quote: string from the transcript`,
  jsonSchema: {
    type: 'object',
    properties: {
      schemaType: { type: 'string', enum: ['image_references'] },
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            prompt: { type: 'string' },
            style: { type: 'string' },
            therapeutic_purpose: { type: 'string' },
            source_quote: { type: 'string' },
          },
          required: ['title', 'prompt', 'therapeutic_purpose'],
        },
      },
    },
    required: ['schemaType', 'images'],
  },
  defaultValues: {
    title: '',
    prompt: '',
    therapeutic_purpose: '',
    style: 'photorealistic',
    source_quote: '',
  },
  fields: [
    {
      id: 'title',
      label: 'Image Title',
      type: 'text',
      required: true,
      placeholder: 'e.g., Strength Visualization',
      validation: { minLength: 3, maxLength: 100 },
      fieldPrompt: 'Generate a concise, evocative title (3-6 words) that captures the therapeutic essence of this image.',
    },
    {
      id: 'prompt',
      label: 'Image Prompt',
      type: 'textarea',
      required: true,
      placeholder: 'Detailed description for AI image generation...',
      helpText: '2-3 sentences describing composition, lighting, colors, elements, style',
      validation: { minLength: 20, maxLength: 1000 },
      fieldPrompt: 'Generate a detailed 2-3 sentence DALL-E prompt describing: visual composition, lighting, colors, elements, and style.',
    },
    {
      id: 'therapeutic_purpose',
      label: 'Therapeutic Purpose',
      type: 'textarea',
      required: true,
      placeholder: 'Why is this image meaningful for the patient?',
      validation: { maxLength: 500 },
      fieldPrompt: 'Explain why this image is therapeutically meaningful (1-2 sentences).',
    },
    {
      id: 'style',
      label: 'Style',
      type: 'select',
      defaultValue: 'photorealistic',
      options: [
        { label: 'Photorealistic', value: 'photorealistic' },
        { label: 'Artistic', value: 'artistic' },
        { label: 'Abstract', value: 'abstract' },
        { label: 'Watercolor', value: 'watercolor' },
        { label: 'Digital Art', value: 'digital' },
        { label: 'Sketch', value: 'sketch' },
      ],
      fieldPrompt: 'Select the visual style that best matches the emotional tone.',
    },
    {
      id: 'source_quote',
      label: 'Source Quote',
      type: 'textarea',
      placeholder: 'Quote from transcript that inspired this image',
      fieldPrompt: 'Include the exact transcript quote that inspired this image.',
    },
  ],
};

const GENERATE_VIDEO_BLOCK: BlockDefinition = {
  id: 'generate_video',
  label: 'Generate Video',
  icon: Video,
  category: 'ai',
  description: 'AI video generation prompt',
  schemaType: 'video_references',
  hasAction: true,
  actionLabel: 'Generate Video',
  defaultSystemPrompt: `Generate video suggestions using image-to-video workflow based on transcript themes.

This uses a TWO-STEP process:
1. First, generate a reference image (still frame)
2. Then, animate that image into a short video

Analyze the selected text for:
1. Natural metaphors or visual imagery the patient uses
2. Emotional states or transformations described
3. Symbolic moments that could be visualized
4. Settings or environments mentioned

Suggest 3-5 video concepts (5-10 seconds each).

**CRITICAL FIELDS:**

1. **reference_image_prompt** (REQUIRED): A detailed DALL-E/image generation prompt for the STARTING frame. Include:
   - Specific visual composition and framing
   - Lighting, colors, and atmosphere
   - Subject positioning and details
   - Artistic style (photorealistic, artistic, dreamlike, etc.)
   - 2-3 sentences, very detailed

2. **prompt**: Animation/motion direction describing HOW to animate the image:
   - Camera movement (slow pan, gentle zoom, static with particle effects)
   - Subject motion (subtle breathing, turning, walking)
   - Environmental animation (clouds moving, water flowing, leaves falling)
   - Lighting changes (sunrise, shadows shifting)
   - 1-2 sentences

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.`,
  jsonSchema: {
    type: 'object',
    properties: {
      schemaType: { type: 'string', enum: ['video_references'] },
      videos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            reference_image_prompt: { type: 'string' },
            prompt: { type: 'string' },
            duration: { type: 'number' },
            style: { type: 'string' },
            therapeutic_purpose: { type: 'string' },
            source_quote: { type: 'string' },
            motion_description: { type: 'string' },
          },
          required: ['title', 'reference_image_prompt', 'prompt', 'therapeutic_purpose'],
        },
      },
    },
    required: ['schemaType', 'videos'],
  },
  defaultValues: {
    title: '',
    reference_image_prompt: '',
    prompt: '',
    duration: 5,
    style: 'cinematic',
    therapeutic_purpose: '',
    source_quote: '',
    motion_description: '',
  },
  fields: [
    {
      id: 'title',
      label: 'Video Title',
      type: 'text',
      required: true,
      placeholder: 'e.g., Journey Through Healing',
      validation: { minLength: 3, maxLength: 100 },
      fieldPrompt: 'Generate an evocative title for the video (3-6 words).',
    },
    {
      id: 'reference_image_prompt',
      label: 'Reference Image Prompt',
      type: 'textarea',
      required: true,
      placeholder: 'Detailed prompt for the starting frame image...',
      helpText: 'Describe the initial still image that will be animated',
      validation: { minLength: 20, maxLength: 1000 },
      fieldPrompt: 'Generate a detailed DALL-E prompt for the starting frame: composition, lighting, subject positioning, style.',
    },
    {
      id: 'prompt',
      label: 'Animation Prompt',
      type: 'textarea',
      required: true,
      placeholder: 'Describe how to animate the image...',
      helpText: 'Camera movement, subject motion, environmental animation',
      validation: { maxLength: 500 },
      fieldPrompt: 'Describe animation direction: camera movement, subject motion, environmental animation.',
    },
    {
      id: 'duration',
      label: 'Duration (seconds)',
      type: 'number',
      defaultValue: 5,
      validation: { min: 3, max: 10 },
      helpText: 'Video length (3-10 seconds)',
      fieldPrompt: 'Suggest duration (3-10 seconds) based on emotional weight.',
    },
    {
      id: 'style',
      label: 'Style',
      type: 'select',
      defaultValue: 'cinematic',
      options: [
        { label: 'Cinematic', value: 'cinematic' },
        { label: 'Documentary', value: 'documentary' },
        { label: 'Artistic', value: 'artistic' },
        { label: 'Abstract', value: 'abstract' },
      ],
      fieldPrompt: 'Select the visual style that best supports the therapeutic narrative.',
    },
    {
      id: 'therapeutic_purpose',
      label: 'Therapeutic Purpose',
      type: 'textarea',
      required: true,
      placeholder: 'How does this video support healing?',
      fieldPrompt: 'Explain how this video supports the patient\'s healing journey.',
    },
    {
      id: 'source_quote',
      label: 'Source Quote',
      type: 'textarea',
      placeholder: 'Quote from transcript',
      fieldPrompt: 'Include the transcript quote that inspired this video.',
    },
    {
      id: 'motion_description',
      label: 'Motion Description',
      type: 'text',
      placeholder: 'Brief summary of the animation',
      fieldPrompt: 'Provide a brief one-sentence summary of the animation.',
    },
  ],
};

const GENERATE_MUSIC_BLOCK: BlockDefinition = {
  id: 'generate_music',
  label: 'Generate Music',
  icon: Music,
  category: 'ai',
  description: 'AI music generation (instrumental or lyrical)',
  schemaType: 'music_generation',
  hasAction: true,
  actionLabel: 'Generate Music',
  defaultSystemPrompt: `Generate therapeutic music options (instrumental and lyrical) based on transcript themes.

Analyze the selected transcript and create TWO music generation options:

**Instrumental Option:**
- Title: Evocative name for the piece
- Genre Tags: Array of 2-3 genres (e.g., ["ambient", "piano", "meditation"])
- Mood: Emotional tone (e.g., "peaceful and reflective", "hopeful and uplifting")
- Music Description: 2-3 sentences describing the musical journey
- Style Prompt: Detailed music generation prompt (instruments, tempo, dynamics, progression)
- Source Quotes: Array of 2-3 quotes from transcript that inspired this music
- Rationale: Why this music supports the therapeutic narrative (2-3 sentences)

**Lyrical Option:**
- Title: Song title
- Genre Tags: Array of 2-3 genres (e.g., ["folk", "acoustic", "singer-songwriter"])
- Mood: Emotional tone
- Suggested Lyrics: Full lyrics (verse 1, chorus, verse 2, chorus, bridge, final chorus)
  - Use patient's own words and metaphors when possible
  - Strength-based, hopeful, empowering language
  - 6-12 lines per section
- Style Prompt: Music generation instructions (vocal style, instrumentation, tempo)
- Source Quotes: Quotes from transcript that inspired the lyrics
- Rationale: Therapeutic purpose of this song

CRITICAL: Output ONLY valid JSON matching the music_generation schema. No markdown, no explanations.`,
  jsonSchema: {
    type: 'object',
    properties: {
      schemaType: { type: 'string', enum: ['music_generation'] },
      instrumental_option: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          genre_tags: { type: 'array', items: { type: 'string' } },
          mood: { type: 'string' },
          music_description: { type: 'string' },
          style_prompt: { type: 'string' },
          source_quotes: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
        },
        required: ['title', 'style_prompt'],
      },
      lyrical_option: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          genre_tags: { type: 'array', items: { type: 'string' } },
          mood: { type: 'string' },
          suggested_lyrics: { type: 'string' },
          style_prompt: { type: 'string' },
          source_quotes: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
        },
        required: ['title', 'suggested_lyrics', 'style_prompt'],
      },
    },
    required: ['schemaType', 'instrumental_option', 'lyrical_option'],
  },
  defaultValues: {
    type: 'instrumental',
    title: '',
    genre_tags: [],
    mood: '',
    style_prompt: '',
    suggested_lyrics: '',
    music_description: '',
    rationale: '',
  },
  fields: [
    {
      id: 'type',
      label: 'Music Type',
      type: 'select',
      required: true,
      defaultValue: 'instrumental',
      options: [
        { label: 'Instrumental', value: 'instrumental' },
        { label: 'Lyrical', value: 'lyrical' },
      ],
      fieldPrompt: 'Choose instrumental for background/meditation music, or lyrical for patient-focused songs.',
    },
    {
      id: 'title',
      label: 'Song Title',
      type: 'text',
      required: true,
      placeholder: 'e.g., Peaceful Journey',
      validation: { maxLength: 100 },
      fieldPrompt: 'Generate an evocative song title that captures the emotional essence.',
    },
    {
      id: 'mood',
      label: 'Mood',
      type: 'text',
      placeholder: 'e.g., peaceful and reflective',
      fieldPrompt: 'Describe the emotional tone (e.g., "peaceful and reflective", "hopeful and uplifting").',
    },
    {
      id: 'style_prompt',
      label: 'Style Prompt',
      type: 'textarea',
      required: true,
      placeholder: 'Describe instruments, tempo, dynamics...',
      helpText: 'Detailed music generation instructions',
      validation: { maxLength: 1000 },
      fieldPrompt: 'Provide detailed music generation instructions: instruments, tempo, dynamics, progression.',
    },
    {
      id: 'suggested_lyrics',
      label: 'Suggested Lyrics',
      type: 'textarea',
      placeholder: 'Full lyrics (for lyrical type)',
      helpText: 'Include verses, chorus, bridge',
      validation: { maxLength: 3000 },
      fieldPrompt: 'Write full lyrics with verse, chorus, bridge. Use patient\'s words when possible.',
    },
    {
      id: 'music_description',
      label: 'Music Description',
      type: 'textarea',
      placeholder: 'Describe the musical journey...',
      fieldPrompt: 'Describe the musical journey in 2-3 sentences.',
    },
    {
      id: 'rationale',
      label: 'Therapeutic Rationale',
      type: 'textarea',
      placeholder: 'Why this music supports the therapeutic narrative',
      fieldPrompt: 'Explain why this music supports the therapeutic narrative.',
    },
  ],
};

const SCENE_CARD_BLOCK: BlockDefinition = {
  id: 'scene_card',
  label: 'Scene Card',
  icon: Film,
  category: 'ai',
  description: 'Therapeutic scene with multiple sections',
  schemaType: 'therapeutic_scene_card',
  hasAction: true,
  actionLabel: 'Create Scene',
  defaultSystemPrompt: `You are a narrative therapy expert creating therapeutic scene cards from session transcripts.

Analyze the selected text and create 2-3 scenes that capture key therapeutic moments.

For each scene, identify:
1. A meaningful patient quote that anchors the scene
2. Therapeutic significance and clinical insights
3. Visual imagery that externalizes the patient's internal experience
4. Animation direction for video production

CRITICAL: Output ONLY valid JSON with this EXACT structure. Start with { and end with }.

IMPORTANT: The JSON MUST have "schemaType" as the FIRST field:
{
  "schemaType": "therapeutic_scene_card",
  "type": "therapeutic_scene_card",
  "title": "Therapeutic Scene Card",
  "subtitle": "Scenes from therapy session",
  "patient": "Patient Name",
  "scenes": [
    {
      "sceneNumber": 1,
      "sections": {
        "patientQuote": {
          "label": "Patient Quote Anchor",
          "content": "Exact meaningful quote from the transcript"
        },
        "meaning": {
          "label": "Therapist Reflection",
          "content": "What this moment reveals therapeutically - clinical observations"
        },
        "imagePrompt": {
          "label": "Image Prompt",
          "content": "Detailed DALL-E prompt: Include specific composition, lighting (warm/cool/dramatic), colors, setting, mood, and symbolic elements. 3-4 sentences."
        },
        "imageToScene": {
          "label": "Image to Scene Direction",
          "content": "How to animate: camera movement (pan, zoom, static), transitions (fade, dissolve), pacing (slow/medium), duration suggestion"
        }
      }
    }
  ],
  "status": "completed"
}

Focus on moments of:
- Insight or self-awareness
- Struggle or emotional breakthrough
- Growth or transformation
- Connection or relationship dynamics
- Hope or resilience`,
  jsonSchema: {
    type: 'object',
    properties: {
      schemaType: { type: 'string', enum: ['therapeutic_scene_card'] },
      type: { type: 'string', enum: ['therapeutic_scene_card'] },
      title: { type: 'string' },
      subtitle: { type: 'string' },
      patient: { type: 'string' },
      scenes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sceneNumber: { type: 'number' },
            sections: {
              type: 'object',
              properties: {
                patientQuote: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    content: { type: 'string' },
                  },
                  required: ['label', 'content'],
                },
                meaning: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    content: { type: 'string' },
                  },
                  required: ['label', 'content'],
                },
                imagePrompt: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    content: { type: 'string' },
                  },
                  required: ['label', 'content'],
                },
                imageToScene: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    content: { type: 'string' },
                  },
                  required: ['label', 'content'],
                },
              },
              required: ['patientQuote', 'meaning', 'imagePrompt', 'imageToScene'],
            },
          },
          required: ['sceneNumber', 'sections'],
        },
      },
      status: { type: 'string', enum: ['pending', 'completed'] },
    },
    required: ['schemaType', 'type', 'title', 'patient', 'scenes', 'status'],
  },
  defaultValues: {
    title: '',
    patient: '',
    patientQuote: '',
    meaning: '',
    imagePrompt: '',
    imageToScene: '',
  },
  fields: [
    {
      id: 'title',
      label: 'Scene Title',
      type: 'text',
      required: true,
      placeholder: 'e.g., Moment of Breakthrough',
      fieldPrompt: 'Generate a scene title that captures the therapeutic moment (3-6 words).',
    },
    {
      id: 'patient',
      label: 'Patient Name',
      type: 'text',
      placeholder: 'Patient associated with this scene',
      fieldPrompt: 'Identify which patient this scene belongs to.',
    },
    {
      id: 'patientQuote',
      label: 'Patient Quote',
      type: 'textarea',
      required: true,
      placeholder: 'Exact meaningful quote from the transcript',
      helpText: 'The quote that anchors this scene',
      fieldPrompt: 'Extract the exact meaningful quote from the transcript that anchors this scene.',
    },
    {
      id: 'meaning',
      label: 'Therapist Reflection',
      type: 'textarea',
      required: true,
      placeholder: 'What this moment reveals therapeutically...',
      fieldPrompt: 'Write clinical observations about what this moment reveals therapeutically.',
    },
    {
      id: 'imagePrompt',
      label: 'Image Prompt',
      type: 'textarea',
      required: true,
      placeholder: 'Detailed DALL-E prompt with composition, lighting, colors...',
      fieldPrompt: 'Generate a detailed DALL-E prompt: composition, lighting, colors, symbolic elements, style.',
    },
    {
      id: 'imageToScene',
      label: 'Scene Direction',
      type: 'textarea',
      required: true,
      placeholder: 'Camera movement, transitions, pacing...',
      fieldPrompt: 'Describe animation: camera movement, transitions, pacing, duration.',
    },
  ],
};

const EXTRACT_QUOTES_BLOCK: BlockDefinition = {
  id: 'extract_quotes',
  label: 'Extract Quotes',
  icon: MessageSquareQuote,
  category: 'ai',
  description: 'Extract meaningful quotes from transcript',
  schemaType: 'quote_extraction',
  hasAction: true,
  actionLabel: 'Extract Quotes',
  defaultSystemPrompt: `AI analyzes selection and extracts therapeutically significant quotes.

Review the selected transcript segment and identify:
1. Moments of insight or self-awareness
2. Expressions of emotion or vulnerability
3. Statements showing agency or choice
4. Metaphors or imagery the patient uses naturally
5. Turning points in the narrative

Extract 3-5 quotes with context.

For each quote, identify which patient it belongs to or is most relevant to. Use the patient's name if identifiable from the conversation context.

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "quote_extraction",
  "extracted_quotes": [
    {
      "quote_text": "exact quote",
      "speaker": "speaker name",
      "patient_name": "patient name this quote belongs to",
      "context": "why therapeutically significant",
      "tags": ["tag1", "tag2"]
    }
  ]
}`,
  jsonSchema: {
    type: 'object',
    properties: {
      schemaType: { type: 'string', enum: ['quote_extraction'] },
      extracted_quotes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            quote_text: { type: 'string' },
            speaker: { type: 'string' },
            patient_name: { type: 'string' },
            context: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['quote_text', 'speaker', 'context'],
        },
      },
    },
    required: ['schemaType', 'extracted_quotes'],
  },
  defaultValues: {
    quote_text: '',
    speaker: '',
    patient_name: '',
    context: '',
    tags: [],
  },
  fields: [
    {
      id: 'quote_text',
      label: 'Quote Text',
      type: 'textarea',
      required: true,
      placeholder: 'The exact quote from transcript',
      fieldPrompt: 'Extract the exact quote showing insight, emotion, agency, or a turning point.',
    },
    {
      id: 'speaker',
      label: 'Speaker',
      type: 'text',
      required: true,
      placeholder: 'Who said this quote',
      fieldPrompt: 'Identify who said this quote.',
    },
    {
      id: 'patient_name',
      label: 'Patient Name',
      type: 'text',
      placeholder: 'Patient this quote belongs to',
      fieldPrompt: 'Identify which patient this quote belongs to or is most relevant to.',
    },
    {
      id: 'context',
      label: 'Context',
      type: 'textarea',
      required: true,
      placeholder: 'Why is this quote therapeutically significant?',
      fieldPrompt: 'Explain why this quote is therapeutically significant.',
    },
  ],
};

const REFLECTION_BLOCK: BlockDefinition = {
  id: 'reflection',
  label: 'Reflection',
  icon: HelpCircle,
  category: 'ai',
  description: 'Patient reflection prompts',
  schemaType: 'reflection_questions',
  hasAction: false,
  defaultSystemPrompt: `Create thoughtful reflection questions for the patient based on the transcript.

Analyze the session themes and generate 3-5 open-ended questions that:
1. Invite deeper self-exploration
2. Build on insights from the session
3. Use strength-based language
4. Encourage narrative expansion
5. Connect past, present, and future

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "reflection_questions",
  "questions": [
    {
      "question": "The question itself",
      "rationale": "Why this question matters",
      "placement": "timing in story page"
    }
  ]
}`,
  jsonSchema: {
    type: 'object',
    properties: {
      schemaType: { type: 'string', enum: ['reflection_questions'] },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            rationale: { type: 'string' },
            placement: { type: 'string' },
          },
          required: ['question', 'rationale'],
        },
      },
    },
    required: ['schemaType', 'questions'],
  },
  defaultValues: {
    question: '',
    rationale: '',
    placement: '',
  },
  fields: [
    {
      id: 'question',
      label: 'Reflection Question',
      type: 'textarea',
      required: true,
      placeholder: 'Open-ended question for patient reflection...',
      helpText: 'Use strength-based, inviting language',
      fieldPrompt: 'Generate an open-ended question that invites deeper self-exploration.',
    },
    {
      id: 'rationale',
      label: 'Rationale',
      type: 'textarea',
      required: true,
      placeholder: 'Why this question matters therapeutically',
      fieldPrompt: 'Explain why this question matters therapeutically.',
    },
    {
      id: 'placement',
      label: 'Placement',
      type: 'text',
      placeholder: 'e.g., After viewing video, At end of page',
      fieldPrompt: 'Suggest optimal timing in the story page.',
    },
  ],
};

const THERAPEUTIC_NOTE_BLOCK: BlockDefinition = {
  id: 'therapeutic_note',
  label: 'Note',
  icon: FileText,
  category: 'ai',
  description: 'Clinical therapeutic notes',
  schemaType: 'therapeutic_note',
  hasAction: true,
  actionLabel: 'Generate Note',
  defaultSystemPrompt: `Generate a structured therapeutic note based on the session transcript.

Read the transcript carefully and create a comprehensive clinical note that includes:
1. Key themes and patterns observed
2. Moments of insight, strength, or resilience
3. Therapeutic progress and challenges
4. Clinical observations and hypotheses
5. Suggested interventions or next steps

Format as a therapeutic note with clear sections.

CRITICAL: Output ONLY valid JSON matching this schema:
{
  "schemaType": "therapeutic_note",
  "note_title": "Brief descriptive title",
  "note_content": "Full analysis in markdown format with sections",
  "key_themes": ["theme1", "theme2", "theme3"],
  "tags": ["tag1", "tag2"]
}`,
  jsonSchema: {
    type: 'object',
    properties: {
      schemaType: { type: 'string', enum: ['therapeutic_note'] },
      note_title: { type: 'string' },
      note_content: { type: 'string' },
      key_themes: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['schemaType', 'note_title', 'note_content'],
  },
  defaultValues: {
    note_title: '',
    note_content: '',
    key_themes: [],
    tags: [],
  },
  fields: [
    {
      id: 'note_title',
      label: 'Note Title',
      type: 'text',
      required: true,
      placeholder: 'Brief descriptive title',
      fieldPrompt: 'Generate a brief descriptive title that captures the main clinical focus.',
    },
    {
      id: 'note_content',
      label: 'Note Content',
      type: 'textarea',
      required: true,
      placeholder: 'Full clinical analysis in markdown format...',
      helpText: 'Include themes, insights, observations, and recommendations',
      validation: { maxLength: 5000 },
      fieldPrompt: 'Write a comprehensive clinical note in markdown format with themes, insights, and recommendations.',
    },
  ],
};

// ============================================================================
// Block Registry
// ============================================================================

export const UI_BLOCKS: BlockDefinition[] = [
  TEXT_BLOCK,
  IMAGE_BLOCK,
  BUTTON_BLOCK,
  HEADER_BLOCK,
  DIVIDER_BLOCK,
  SPACER_BLOCK,
  SPLIT_BLOCK,
  QUOTE_BLOCK,
];

export const AI_BLOCKS: BlockDefinition[] = [
  GENERATE_IMAGE_BLOCK,
  GENERATE_VIDEO_BLOCK,
  GENERATE_MUSIC_BLOCK,
  SCENE_CARD_BLOCK,
  EXTRACT_QUOTES_BLOCK,
  REFLECTION_BLOCK,
  THERAPEUTIC_NOTE_BLOCK,
];

export const ALL_BLOCKS: BlockDefinition[] = [...UI_BLOCKS, ...AI_BLOCKS];

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = Object.fromEntries(
  ALL_BLOCKS.map(block => [block.id, block]),
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a block definition by ID
 */
export function getBlockDefinition(blockType: string): BlockDefinition | undefined {
  return BLOCK_REGISTRY[blockType];
}

/**
 * Create a new block instance with default values
 */
export function createBlockInstance(blockType: string): BlockInstance | null {
  const definition = getBlockDefinition(blockType);
  if (!definition) return null;

  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    blockType,
    values: { ...definition.defaultValues },
    order: 0,
  };
}

/**
 * Validate a block instance against its definition
 */
export function validateBlockInstance(instance: BlockInstance): string[] {
  const errors: string[] = [];
  const definition = getBlockDefinition(instance.blockType);

  if (!definition) {
    errors.push(`Unknown block type: ${instance.blockType}`);
    return errors;
  }

  for (const field of definition.fields) {
    const value = instance.values[field.id];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label} is required`);
      continue;
    }

    if (value && field.validation) {
      if (field.validation.minLength && value.length < field.validation.minLength) {
        errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
      }
      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        errors.push(`${field.label} must be at most ${field.validation.maxLength} characters`);
      }
      if (field.validation.min && value < field.validation.min) {
        errors.push(`${field.label} must be at least ${field.validation.min}`);
      }
      if (field.validation.max && value > field.validation.max) {
        errors.push(`${field.label} must be at most ${field.validation.max}`);
      }
    }
  }

  return errors;
}
