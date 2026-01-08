/**
 * Seed Script: System-Level AI Prompts
 * Creates default system prompts available to all users
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';

import { eq } from 'drizzle-orm';
// Import drizzle and pg directly to bypass Env validation
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { moduleAiPromptsSchema, usersSchema } from '../src/models/Schema';
import * as schema from '../src/models/Schema';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Create database connection directly
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// === ESSENTIAL SYSTEM PROMPTS (7 JSON PROMPTS) ===
// Only JSON-formatted prompts with implemented renderers
const systemPrompts = [
  // === UTILITY PROMPTS (5) ===

  // 1. REFLECTION QUESTIONS (JSON)
  {
    name: 'Generate Reflection Questions',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Create thoughtful reflection questions for the patient based on the transcript.

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
    userPrompt: null,
    description: 'Generate personalized reflection questions for story pages',
    category: 'reflection',
    icon: 'message-circle',
    outputType: 'json',
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
  },

  // 2. THERAPEUTIC NOTE (JSON)
  {
    name: 'Therapeutic Note',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Generate a structured therapeutic note based on the session transcript.

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
    userPrompt: null,
    description: 'Generate structured therapeutic notes from session content',
    category: 'analysis',
    icon: 'file-text',
    outputType: 'json',
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
  },

  // 3. MUSIC GENERATION (JSON)
  {
    name: 'Music Generation Options',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Generate therapeutic music options (instrumental and lyrical) based on transcript themes.

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

CRITICAL: Output ONLY valid JSON matching the music_generation schema. No markdown, no explanations.

Example structure:
{
  "instrumental_option": { ... },
  "lyrical_option": { ... }
}`,
    userPrompt: null,
    description: 'Generate instrumental and lyrical music options based on transcript',
    category: 'creative',
    icon: 'music',
    outputType: 'json',
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
  },

  // 4. IMAGE GENERATION (JSON)
  {
    name: 'Potential Images',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Generate image suggestions based on transcript themes and metaphors.

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
    userPrompt: null,
    description: 'Generate image suggestions based on transcript themes and metaphors',
    category: 'creative',
    icon: 'image',
    outputType: 'json',
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
  },

  // 5. EXTRACT QUOTES (JSON)
  {
    name: 'Extract Meaningful Quotes',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `AI analyzes selection and extracts therapeutically significant quotes.

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
    userPrompt: null,
    description: 'Extract therapeutically meaningful quotes with context',
    category: 'extraction',
    icon: 'quote',
    outputType: 'json',
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
  },

  // === SCENE GENERATION PROMPT ===

  // 6. CREATE A SCENE (JSON) - User-friendly prompt for scene generation modal
  {
    name: 'Create A Scene',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `You are a narrative therapy expert creating therapeutic scene cards from session transcripts.

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
    userPrompt: null,
    description: 'Create therapeutic scenes that open in the full scene editor',
    category: 'creative',
    icon: 'video',
    outputType: 'json',
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
  },

  // 7. VIDEO GENERATION (JSON) - Image-to-Video Workflow
  {
    name: 'Potential Videos',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Generate video suggestions using image-to-video workflow based on transcript themes.

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

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "video_references",
  "videos": [
    {
      "title": "Video title",
      "reference_image_prompt": "DETAILED image prompt: A serene forest clearing at golden hour, soft sunlight filtering through tall oak trees, creating dappled shadows on moss-covered ground. A single figure sits peacefully on a fallen log, their posture relaxed and contemplative. Photorealistic style with warm, dreamy lighting.",
      "prompt": "Gentle camera push-in toward the figure, subtle movement of leaves in the breeze, light rays slowly shifting as clouds pass, figure takes a deep breath with shoulders rising slightly",
      "duration": 5,
      "style": "cinematic",
      "therapeutic_purpose": "Why this video supports healing",
      "source_quote": "Quote from transcript",
      "motion_description": "Brief summary of the animation"
    }
  ]
}`,
    userPrompt: null,
    description: 'Generate video suggestions using image-to-video workflow',
    category: 'creative',
    icon: 'video',
    outputType: 'json',
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
  },
];

async function seedSystemPrompts() {
  try {
    console.log('🌱 Seeding system prompts...');

    // Get or create a system user (super admin)
    let systemUser = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.email, 'system@storycare.health'),
    });

    if (!systemUser) {
      console.log('Creating system user...');
      const result = await db
        .insert(usersSchema)
        .values({
          email: 'system@storycare.health',
          name: 'System',
          role: 'super_admin',
        })
        .returning();
      systemUser = (result as any[])[0];
    }

    if (!systemUser) {
      throw new Error('Failed to create or find system user');
    }

    console.log(`Using system user: ${systemUser.email} (${systemUser.id})`);

    // Insert or update each prompt
    for (const promptData of systemPrompts) {
      try {
        const [existingPrompt] = await db
          .select()
          .from(moduleAiPromptsSchema)
          .where(eq(moduleAiPromptsSchema.name, promptData.name))
          .limit(1);

        if (existingPrompt) {
          // Update existing prompt with new systemPrompt structure
          await db
            .update(moduleAiPromptsSchema)
            .set({
              promptText: promptData.promptText,
              systemPrompt: promptData.systemPrompt,
              userPrompt: promptData.userPrompt,
              description: promptData.description,
              category: promptData.category,
              icon: promptData.icon,
              outputType: promptData.outputType,
              jsonSchema: promptData.jsonSchema,
              updatedAt: new Date(),
            })
            .where(eq(moduleAiPromptsSchema.id, existingPrompt.id));

          console.log(`🔄 Updated: "${promptData.name}" (migrated to systemPrompt)`);
          continue;
        }

        const result = await db
          .insert(moduleAiPromptsSchema)
          .values({
            ...promptData,
            scope: 'system',
            organizationId: null,
            createdBy: systemUser.id,
            isActive: true,
            useCount: 0,
          })
          .returning();

        const newPrompt = (result as any[])[0];
        if (newPrompt) {
          console.log(`✅ Created: "${newPrompt.name}" (${newPrompt.category})`);
        }
      } catch (error) {
        console.error(`❌ Error creating "${promptData.name}":`, error);
      }
    }

    console.log('');
    console.log('✨ Seed complete!');
    console.log(`Processed ${systemPrompts.length} system prompts (7 JSON prompts)`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await pool.end();
    process.exit(1);
  }
}

seedSystemPrompts();
