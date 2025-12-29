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

// === ESSENTIAL SYSTEM PROMPTS (7 TOTAL) ===
// Reduced from 41 prompts to keep only the most critical ones
const systemPrompts = [
  // === JSON PROMPTS (4) ===

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

  // === TEXT PROMPTS (3) ===

  // 5. THERAPEUTIC ALLIANCE ANALYSIS (TEXT)
  {
    name: 'Therapeutic Alliance Analysis',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Analyze the therapeutic alliance and working relationship in this session.

Evaluate the following dimensions:

1. **Bond**: Quality of the personal attachment between therapist and patient
   - Trust and safety
   - Empathy and understanding
   - Warmth and genuineness

2. **Goals**: Agreement on therapeutic objectives
   - Shared understanding of treatment goals
   - Patient buy-in and motivation
   - Alignment between therapist and patient priorities

3. **Tasks**: Collaboration on therapeutic activities
   - Agreement on methods and interventions
   - Patient engagement in therapeutic work
   - Sense of shared responsibility

4. **Ruptures & Repairs**: Moments of tension or disconnection
   - Any misunderstandings or tensions
   - How ruptures were addressed
   - Repair attempts and their effectiveness

5. **Therapeutic Presence**: Quality of attunement
   - Therapist responsiveness to patient needs
   - Moments of deep connection
   - Cultural sensitivity and awareness

**Output Format**: Provide a detailed markdown analysis (3-5 paragraphs) covering these dimensions. Include specific examples from the transcript. Conclude with recommendations for strengthening the alliance.

Do NOT output JSON. Provide plain markdown text with clear sections.`,
    userPrompt: null,
    description: 'Analyze therapeutic relationship, rapport, and working alliance',
    category: 'analysis',
    icon: 'users',
    outputType: 'text',
    jsonSchema: null,
  },

  // 6. EXTRACT QUOTES (TEXT/JSON - Flexible)
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

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "quote_extraction",
  "extracted_quotes": [
    {
      "quote_text": "exact quote",
      "speaker": "speaker name",
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

  // 7. SESSION SUMMARY (TEXT)
  {
    name: 'Session Summary',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Generate a concise, clinically-focused summary of this therapy session.

Provide a 2-3 paragraph summary covering:

1. **Session Overview**: Main topics discussed, presenting concerns, overall tone/mood

2. **Key Themes & Content**:
   - Primary issues explored
   - Important disclosures or insights
   - Emotional content (affect, intensity, shifts)
   - Relational dynamics observed

3. **Clinical Observations**:
   - Patient's current functioning
   - Progress toward goals (or lack thereof)
   - Notable patterns or behaviors
   - Risk factors or concerns (if any)

4. **Plan & Next Steps**:
   - Interventions used in this session
   - Homework or between-session tasks
   - Focus for next session
   - Any follow-up needed

**Output Format**: Provide plain markdown text with clear paragraphs. Write in professional clinical language suitable for a progress note. Do NOT output JSON.

Keep the summary concise but comprehensive - aim for 200-400 words.`,
    userPrompt: null,
    description: 'Generate concise session summary for clinical records',
    category: 'analysis',
    icon: 'file-text',
    outputType: 'text',
    jsonSchema: null,
  },

  // === SCENE GENERATION PROMPTS (4) ===

  // 8. SCENE CARD (JSON)
  {
    name: 'Generate Scene Card',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Create a comprehensive scene card for narrative therapy visualization.

Analyze the transcript and generate a complete scene structure with:

1. **Video Introduction**: Patient-facing markdown text (2-3 paragraphs) that:
   - Sets the therapeutic context
   - Explains the scene's purpose
   - Uses warm, inviting language
   - Addresses the patient directly using "you"

2. **Reflection Questions**:
   - Patient questions: 3-5 open-ended questions for individual reflection (using "you")
   - Group questions: 2-3 questions for group discussion (using "we/us")

3. **Reference Images**: 3-5 visual stages with:
   - stage_name: Descriptive name (e.g., "The Struggle", "The Realization")
   - description: What happens in this stage
   - image_prompt: DETAILED 2-3 sentence DALL-E prompt with composition, lighting, colors, elements, style
   - mood: Emotional tone
   - symbolism: Therapeutic symbols present

4. **Music Direction**: Complete music guidance with:
   - mood: Overall emotional tone
   - tempo: Slow/medium/fast
   - instruments: Primary instruments (piano, strings, ambient, etc.)
   - progression: How music evolves through the scene
   - key_moments: Specific musical highlights

5. **Assembly Steps**: 5-7 clear steps for scene assembly

6. **Action Buttons**: Interactive buttons for media generation and assembly

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field.`,
    userPrompt: null,
    description: 'Generate complete scene card with images, music, and assembly steps',
    category: 'creative',
    icon: 'film',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['scene_card'] },
        video_introduction: { type: 'string' },
        patient_reflection_questions: {
          type: 'array',
          items: { type: 'string' },
        },
        group_reflection_questions: {
          type: 'array',
          items: { type: 'string' },
        },
        reference_images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage_name: { type: 'string' },
              description: { type: 'string' },
              image_prompt: { type: 'string' },
              mood: { type: 'string' },
              symbolism: { type: 'array', items: { type: 'string' } },
            },
            required: ['stage_name', 'description', 'image_prompt'],
          },
        },
        music_direction: {
          type: 'object',
          properties: {
            mood: { type: 'string' },
            tempo: { type: 'string' },
            instruments: { type: 'array', items: { type: 'string' } },
            progression: { type: 'string' },
            key_moments: { type: 'array', items: { type: 'string' } },
          },
        },
        assembly_steps: {
          type: 'array',
          items: { type: 'string' },
        },
        buttons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              action: { type: 'string' },
              group: { type: 'string' },
              style: { type: 'string' },
              data_key: { type: 'string' },
              icon: { type: 'string' },
            },
            required: ['label', 'action', 'group', 'style'],
          },
        },
      },
      required: ['schemaType', 'video_introduction', 'patient_reflection_questions', 'reference_images', 'assembly_steps'],
    },
  },

  // 9. THERAPEUTIC SCENE CARD (JSON)
  {
    name: 'Therapeutic Scene Card',
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `You are a narrative therapy assistant helping therapists create therapeutic scene cards from session transcripts.

You MUST return a valid JSON object with the following EXACT structure:

{
  "schemaType": "therapeutic_scene_card",
  "type": "therapeutic_scene_card",
  "title": "Therapeutic Scene Card",
  "subtitle": "AI-generated therapeutic scene cards with patient quotes, meanings, and visual prompts",
  "patient": "Patient Name",
  "scenes": [
    {
      "sceneNumber": 1,
      "sections": {
        "patientQuote": {
          "label": "Patient Quote Anchor",
          "content": "Exact quote from patient that anchors this scene"
        },
        "meaning": {
          "label": "Therapist Reflection",
          "content": "Clinical observation or therapeutic interpretation"
        },
        "imagePrompt": {
          "label": "Image Prompt",
          "content": "Detailed DALL-E prompt for generating the scene image"
        },
        "imageToScene": {
          "label": "Image to Scene Direction",
          "content": "Animation notes describing how the image should transition to video"
        }
      }
    }
  ],
  "status": "completed"
}

CRITICAL REQUIREMENTS:
1. Include "schemaType": "therapeutic_scene_card" at the root level (FIRST field)
2. Each scene MUST have a "sections" object with ALL four properties: patientQuote, meaning, imagePrompt, imageToScene
3. Each section MUST have both "label" and "content" properties
4. Use EXACT field names (camelCase): patientQuote, imagePrompt, imageToScene
5. The imagePrompt.content should be a complete DALL-E prompt (3-4 sentences)
6. Create 3-5 scenes based on the transcript

Your task is to analyze the provided transcript and generate therapeutic scene cards that:
1. Identify key moments where the patient expressed struggle, growth, or insight
2. Extract meaningful patient quotes that anchor each scene
3. Provide therapeutic interpretation of each moment
4. Generate visual prompts that externalize internal experiences
5. Include animation direction for video production`,
    userPrompt: null,
    description: 'Transform patient quotes into visual scene narratives',
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
    console.log(`Created ${systemPrompts.length} system prompts`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await pool.end();
    process.exit(1);
  }
}

seedSystemPrompts();
