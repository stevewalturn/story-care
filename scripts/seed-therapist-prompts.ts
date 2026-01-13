/**
 * Seed Script: Therapist Private Prompts
 * Creates editable prompts for a specific therapist with block format
 *
 * Usage: npx tsx scripts/seed-therapist-prompts.ts
 */

import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { moduleAiPromptsSchema, usersSchema } from '../src/models/Schema';
import * as schema from '../src/models/Schema';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// Target therapist email
const THERAPIST_EMAIL = 'akbarandriawanakak@gmail.com';

// Helper to create block instance with outputFields
function createBlock(
  blockType: string,
  systemPrompt: string,
  outputFields: any[] = [],
  order: number = 0
) {
  return {
    id: `block-${Date.now()}-${order}-${Math.random().toString(36).substring(7)}`,
    blockType,
    values: {},
    order,
    customSystemPrompt: systemPrompt,
    outputFields: outputFields.length > 0 ? outputFields : undefined,
  };
}

// Helper to create output field
function createOutputField(
  fieldTypeId: string,
  name: string,
  label: string,
  order: number,
  config: any = {},
  locked?: boolean
) {
  return {
    id: `field-${Date.now()}-${order}-${Math.random().toString(36).substring(7)}`,
    fieldTypeId,
    order,
    locked, // Add locked property
    config: {
      name,
      label,
      type: config.type || 'string',
      required: config.required || false,
      aiGenerate: config.aiGenerate !== false,
      displayStyle: config.displayStyle || 'default',
      fieldPrompt: config.fieldPrompt || '',
      description: config.description || '',
      colorScheme: config.colorScheme,
      arrayItemType: config.arrayItemType,
      ...config,
    },
  };
}

// Private prompts for the therapist (editable through UI)
const therapistPrompts = [
  // 1. REFLECTION QUESTIONS
  {
    name: 'My Reflection Questions',
    promptText: '',
    systemPrompt: `Create thoughtful reflection questions for the patient based on the transcript.

Analyze the session themes and generate 3-5 open-ended questions that:
1. Invite deeper self-exploration
2. Build on insights from the session
3. Use strength-based language
4. Encourage narrative expansion
5. Connect past, present, and future`,
    userPrompt: null,
    description: 'Generate personalized reflection questions for story pages',
    category: 'reflection',
    icon: 'message-circle',
    outputType: 'json',
    // Block format with visual output fields
    blocks: (systemPrompt: string) => [
      createBlock(
        'reflection',
        systemPrompt,
        [
          createOutputField('text', 'schemaType', 'Schema Type', 0, {
            type: 'string',
            required: true,
            aiGenerate: false,
            displayStyle: 'hidden',
            defaultValue: 'reflection_questions',
          }),
          createOutputField('array', 'questions', 'Reflection Questions', 1, {
            type: 'array',
            required: true,
            arrayItemType: 'object',
            displayStyle: 'card',
            colorScheme: 'purple',
            fieldPrompt: 'Generate 3-5 open-ended questions that invite self-exploration and build on session insights',
          }),
        ],
        0
      ),
    ],
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

  // 2. THERAPEUTIC NOTE
  {
    name: 'My Therapeutic Note',
    promptText: '',
    systemPrompt: `Generate a structured therapeutic note based on the session transcript.

Read the transcript carefully and create a comprehensive clinical note that includes:
1. Key themes and patterns observed
2. Moments of insight, strength, or resilience
3. Therapeutic progress and challenges
4. Clinical observations and hypotheses
5. Suggested interventions or next steps`,
    userPrompt: null,
    description: 'Generate structured therapeutic notes from session content',
    category: 'analysis',
    icon: 'file-text',
    outputType: 'json',
    // Block format with visual output fields
    blocks: (systemPrompt: string) => [
      createBlock(
        'therapeutic_note',
        systemPrompt,
        [
          createOutputField('text', 'schemaType', 'Schema Type', 0, {
            type: 'string',
            required: true,
            aiGenerate: false,
            displayStyle: 'hidden',
            defaultValue: 'therapeutic_note',
          }),
          createOutputField('text', 'note_title', 'Note Title', 1, {
            type: 'string',
            required: true,
            displayStyle: 'prominent',
            colorScheme: 'blue',
            fieldPrompt: 'Generate a brief descriptive title that captures the main clinical focus',
          }),
          createOutputField('textarea', 'note_content', 'Clinical Analysis', 2, {
            type: 'string',
            required: true,
            displayStyle: 'expandable',
            maxLines: 10,
            fieldPrompt: 'Write comprehensive clinical note in markdown format with themes, insights, observations, and recommendations',
          }),
          createOutputField('tags', 'key_themes', 'Key Themes', 3, {
            type: 'array',
            arrayItemType: 'string',
            displayStyle: 'badge',
            colorScheme: 'purple',
            fieldPrompt: 'Extract 3-5 key therapeutic themes',
          }),
          createOutputField('tags', 'tags', 'Tags', 4, {
            type: 'array',
            arrayItemType: 'string',
            displayStyle: 'badge',
            colorScheme: 'gray',
            fieldPrompt: 'Add relevant clinical tags for categorization',
          }),
        ],
        0
      ),
    ],
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

  // 3. MUSIC GENERATION
  {
    name: 'My Music Generation',
    promptText: '',
    systemPrompt: `Generate therapeutic music options (instrumental and lyrical) based on transcript themes.

Create TWO music options:
- Instrumental: Evocative title, genre tags, mood, music description, style prompt, source quotes, rationale
- Lyrical: Song title, genre tags, mood, full lyrics (verse/chorus/bridge), style prompt, source quotes, rationale

Use patient's words and metaphors when possible. Keep language strength-based and empowering.`,
    userPrompt: null,
    description: 'Generate instrumental and lyrical music options based on transcript',
    category: 'creative',
    icon: 'music',
    outputType: 'json',
    // Block format with visual output fields
    blocks: (systemPrompt: string) => [
      createBlock(
        'generate_music',
        systemPrompt,
        [
          createOutputField('text', 'schemaType', 'Schema Type', 0, {
            type: 'string',
            required: true,
            aiGenerate: false,
            displayStyle: 'hidden',
            defaultValue: 'music_generation',
          }),
          createOutputField('object', 'instrumental_option', 'Instrumental Music', 1, {
            type: 'object',
            required: true,
            displayStyle: 'card',
            colorScheme: 'blue',
            fieldPrompt: 'Generate instrumental music option with title, genre tags, mood, description, and Suno AI style prompt',
          }),
          createOutputField('object', 'lyrical_option', 'Lyrical Music', 2, {
            type: 'object',
            required: true,
            displayStyle: 'card',
            colorScheme: 'purple',
            fieldPrompt: 'Generate lyrical music option with title, full lyrics, genre tags, mood, and Suno AI style prompt',
          }),
        ],
        0
      ),
    ],
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

  // 4. IMAGE GENERATION
  {
    name: 'My Image Ideas',
    promptText: '',
    systemPrompt: `Generate image suggestions based on transcript themes and metaphors.

Analyze the selected text for:
1. Natural metaphors the patient uses
2. Emotional states described
3. Relationships and connections
4. Transformation or change themes
5. Settings or environments mentioned

Suggest 3-5 image concepts with detailed DALL-E generation prompts (2-3 sentences with composition, lighting, colors, elements, style).`,
    userPrompt: null,
    description: 'Generate image suggestions based on transcript themes and metaphors',
    category: 'creative',
    icon: 'image',
    outputType: 'json',
    // Block format with visual output fields
    blocks: (systemPrompt: string) => [
      createBlock(
        'generate_image',
        systemPrompt,
        [
          createOutputField('text', 'schemaType', 'Schema Type', 0, {
            type: 'string',
            required: true,
            aiGenerate: false,
            displayStyle: 'hidden',
            defaultValue: 'image_references',
          }),
          createOutputField('array', 'images', 'Image Suggestions', 1, {
            type: 'array',
            required: true,
            arrayItemType: 'object',
            displayStyle: 'card',
            colorScheme: 'green',
            minItems: 3,
            maxItems: 5,
            fieldPrompt: 'Generate 3-5 therapeutic image concepts with detailed DALL-E prompts',
          }),
        ],
        0
      ),
    ],
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

  // 5. EXTRACT QUOTES
  {
    name: 'My Quote Extractor',
    promptText: '',
    systemPrompt: `Extract therapeutically significant quotes from the transcript.

Review the selected segment and identify:
1. Moments of insight or self-awareness
2. Expressions of emotion or vulnerability
3. Statements showing agency or choice
4. Metaphors or imagery the patient uses naturally
5. Turning points in the narrative

Extract 3-5 quotes with context and patient attribution.`,
    userPrompt: null,
    description: 'Extract therapeutically meaningful quotes with context',
    category: 'extraction',
    icon: 'quote',
    outputType: 'json',
    // Block format with visual output fields
    blocks: (systemPrompt: string) => [
      createBlock(
        'extract_quotes',
        systemPrompt,
        [
          createOutputField('text', 'schemaType', 'Schema Type', 0, {
            type: 'string',
            required: true,
            aiGenerate: false,
            displayStyle: 'hidden',
            defaultValue: 'quote_extraction',
          }),
          createOutputField('array', 'extracted_quotes', 'Meaningful Quotes', 1, {
            type: 'array',
            required: true,
            arrayItemType: 'object',
            displayStyle: 'card',
            colorScheme: 'amber',
            minItems: 3,
            maxItems: 5,
            fieldPrompt: 'Extract 3-5 therapeutically significant quotes with speaker, patient, context, and tags',
          }),
        ],
        0
      ),
    ],
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

  // 6. CREATE A SCENE
  {
    name: 'My Scene Creator',
    promptText: '',
    systemPrompt: `Create therapeutic scene cards from session transcripts.

Analyze the selected text and create 2-3 scenes that capture key therapeutic moments.

For each scene, identify:
1. A meaningful patient quote that anchors the scene
2. Therapeutic significance and clinical insights
3. Visual imagery (detailed DALL-E prompt)
4. Animation direction for video production

Focus on moments of insight, breakthrough, growth, connection, or resilience.`,
    userPrompt: null,
    description: 'Create therapeutic scenes that open in the full scene editor',
    category: 'creative',
    icon: 'video',
    outputType: 'json',
    // Block format with visual output fields
    blocks: (systemPrompt: string) => [
      createBlock(
        'scene_card',
        systemPrompt,
        [
          createOutputField('text', 'schemaType', 'Schema Type', 0, {
            type: 'string',
            required: true,
            aiGenerate: false,
            displayStyle: 'hidden',
            defaultValue: 'therapeutic_scene_card',
          }),
          createOutputField('text', 'title', 'Scene Card Title', 1, {
            type: 'string',
            required: true,
            displayStyle: 'prominent',
            colorScheme: 'indigo',
            fieldPrompt: 'Generate an evocative title for this therapeutic scene card',
          }),
          createOutputField('text', 'patient', 'Patient Name', 2, {
            type: 'string',
            required: true,
            displayStyle: 'default',
            fieldPrompt: 'Identify which patient this scene belongs to',
          }),
          createOutputField('array', 'scenes', 'Therapeutic Scenes', 3, {
            type: 'array',
            required: true,
            arrayItemType: 'object',
            displayStyle: 'card',
            colorScheme: 'purple',
            minItems: 2,
            maxItems: 3,
            fieldPrompt: 'Create 2-3 scenes with patient quote, meaning, image prompt, and animation direction',
          }),
        ],
        0
      ),
    ],
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

  // 7. VIDEO GENERATION
  {
    name: 'My Video Ideas',
    promptText: '',
    systemPrompt: `Generate video suggestions using image-to-video workflow based on transcript themes.

TWO-STEP process:
1. Generate reference image (starting frame) with detailed DALL-E prompt
2. Animate that image with motion direction

Analyze for:
- Natural metaphors or visual imagery
- Emotional states or transformations
- Symbolic moments
- Settings or environments

Suggest 3-5 video concepts (5-10 seconds each) with reference image prompt, animation direction, therapeutic purpose, and source quote.`,
    userPrompt: null,
    description: 'Generate video suggestions using image-to-video workflow',
    category: 'creative',
    icon: 'video',
    outputType: 'json',
    // Block format with visual output fields
    blocks: (systemPrompt: string) => [
      createBlock(
        'generate_video',
        systemPrompt,
        [
          createOutputField('text', 'schemaType', 'Schema Type', 0, {
            type: 'string',
            required: true,
            aiGenerate: false,
            displayStyle: 'hidden',
            defaultValue: 'video_references',
          }),
          createOutputField('array', 'videos', 'Video Suggestions', 1, {
            type: 'array',
            required: true,
            arrayItemType: 'object',
            displayStyle: 'card',
            colorScheme: 'indigo',
            minItems: 3,
            maxItems: 5,
            fieldPrompt: 'Generate 3-5 video concepts with reference image prompt, animation direction, duration, style, therapeutic purpose, and source quote',
          }),
        ],
        0
      ),
    ],
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

async function seedTherapistPrompts() {
  try {
    console.log('🌱 Seeding therapist prompts (with block format)...');
    console.log(`Target therapist: ${THERAPIST_EMAIL}`);

    // Find the therapist user
    const therapist = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.email, THERAPIST_EMAIL),
    });

    if (!therapist) {
      console.error(`❌ Therapist not found with email: ${THERAPIST_EMAIL}`);
      console.log('Please ensure the user exists in the database first.');
      await pool.end();
      process.exit(1);
    }

    console.log(`Found therapist: ${therapist.name} (${therapist.id})`);

    // Insert or update each prompt
    for (const promptData of therapistPrompts) {
      try {
        // Generate blocks array with the system prompt
        const blocksArray = promptData.blocks(promptData.systemPrompt);

        const [existingPrompt] = await db
          .select()
          .from(moduleAiPromptsSchema)
          .where(eq(moduleAiPromptsSchema.name, promptData.name))
          .limit(1);

        if (existingPrompt) {
          // Update existing prompt
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
              blocks: blocksArray, // Add blocks for native block builder support
              updatedAt: new Date(),
            })
            .where(eq(moduleAiPromptsSchema.id, existingPrompt.id));

          console.log(`🔄 Updated: "${promptData.name}" (with blocks)`);
          continue;
        }

        // Create new prompt
        const [newPrompt] = await db
          .insert(moduleAiPromptsSchema)
          .values({
            name: promptData.name,
            promptText: promptData.promptText,
            systemPrompt: promptData.systemPrompt,
            userPrompt: promptData.userPrompt,
            description: promptData.description,
            category: promptData.category,
            icon: promptData.icon,
            outputType: promptData.outputType,
            jsonSchema: promptData.jsonSchema,
            blocks: blocksArray, // Add blocks for native block builder support
            scope: 'private',
            organizationId: null,
            createdBy: therapist.id,
            isActive: true,
            useCount: 0,
          })
          .returning();

        if (newPrompt) {
          console.log(`✅ Created: "${newPrompt.name}" (${newPrompt.category}) with blocks`);
        }
      } catch (error) {
        console.error(`❌ Error creating "${promptData.name}":`, error);
      }
    }

    console.log('');
    console.log('✨ Seed complete!');
    console.log(`Created ${therapistPrompts.length} private prompts for ${THERAPIST_EMAIL}`);
    console.log('');
    console.log('These prompts now have native block format - no migration needed!');
    console.log('Edit them at: /therapist/prompt-library');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await pool.end();
    process.exit(1);
  }
}

seedTherapistPrompts();
