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

const systemPrompts = [
  {
    name: 'Self-Resilience & Re-Authoring Analysis',
    promptText: `Read the transcript carefully. Locate passages about struggle, adversity, and survival. Extract moments where the person demonstrated resilience, agency, or strength - even in small ways.

Focus on:
1. Externalizing problems (the problem is not the person)
2. Internalizing strengths (the person has inherent capabilities)
3. Alternative narratives (other possible interpretations)
4. Unique outcomes (times they acted differently than the problem would predict)

Extract 2-3 meaningful quotes that show resilience. Summarize therapeutic themes in 2-3 sentences. Suggest visual scenes or metaphors that capture their journey of survival and strength.

Output ONLY valid JSON matching this schema:
{
  "schemaType": "therapeutic_note",
  "note_title": "Brief title",
  "note_content": "Full analysis in markdown format",
  "key_themes": ["theme1", "theme2"],
  "tags": ["tag1", "tag2"]
}`,
    description: 'Analyze for moments of personal agency, strength, and alternative narratives',
    category: 'analysis',
    icon: 'target',
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
  {
    name: 'Create A Scene',
    promptText: `Generate a therapeutic scene visualization from transcript moments.

Analyze the selected text and create a vivid visual scene description that:
1. Captures the emotional core of the therapeutic moment
2. Uses metaphor and sensory language
3. Embodies the patient's narrative journey
4. Suggests specific visual elements (setting, lighting, colors, symbols)
5. Conveys hope or possibility

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt with:
- Specific visual composition and framing
- Lighting quality, colors, and atmosphere
- Concrete elements and their spatial arrangement
- Artistic style and emotional mood
- 2-3 sentences with rich visual details

Output ONLY valid JSON:
{
  "schemaType": "scene_visualization",
  "title": "Scene title",
  "description": "Detailed scene description",
  "dalle_prompt": "DETAILED generation prompt (2-3 sentences: composition, lighting, colors, elements, style)",
  "mood": "Emotional tone",
  "symbolic_elements": ["symbol1", "symbol2"],
  "therapeutic_purpose": "Why this scene matters"
}`,
    description: 'Generate therapeutic scene visualization from transcript moments',
    category: 'creative',
    icon: 'sparkles',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['scene_visualization'] },
        title: { type: 'string' },
        description: { type: 'string' },
        dalle_prompt: { type: 'string' },
        mood: { type: 'string' },
        symbolic_elements: { type: 'array', items: { type: 'string' } },
        therapeutic_purpose: { type: 'string' },
      },
      required: ['schemaType', 'title', 'dalle_prompt', 'therapeutic_purpose'],
    },
  },
  {
    name: 'Extract Meaningful Quotes',
    promptText: `AI analyzes selection and extracts therapeutically significant quotes.

Review the selected transcript segment and identify:
1. Moments of insight or self-awareness
2. Expressions of emotion or vulnerability
3. Statements showing agency or choice
4. Metaphors or imagery the patient uses naturally
5. Turning points in the narrative

Extract 3-5 quotes with context.

Output ONLY valid JSON:
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
    description: 'AI extracts therapeutically meaningful quotes with context',
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
  {
    name: 'Potential Images',
    promptText: `Generate image suggestions based on transcript themes and metaphors.

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

Required JSON fields:
- schemaType: "image_references"
- images: array of objects, each with:
  - title: string
  - prompt: DETAILED 2-3 sentence image generation prompt with composition, lighting, colors, elements, style
  - style: string (photorealistic, artistic, abstract, etc.)
  - therapeutic_purpose: string
  - source_quote: string from the transcript`,
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
  {
    name: 'Grounding & Regulation Analysis',
    promptText: `Identify grounding and emotional regulation opportunities in the transcript.

Analyze for:
1. Moments of dysregulation (heightened emotion, dissociation, overwhelm)
2. Natural grounding techniques the patient already uses
3. Opportunities for somatic awareness
4. Patterns in emotional triggers
5. Windows of tolerance (optimal arousal zone)

Extract:
- Specific moments showing dysregulation
- Patient's existing coping mechanisms
- Suggestions for grounding interventions
- Themes for psychoeducation about regulation

Provide therapeutic insights for helping the patient build regulation capacity.

Output ONLY valid JSON:
{
  "schemaType": "therapeutic_note",
  "title": "Grounding & Regulation Analysis",
  "content": "detailed therapeutic analysis...",
  "tags": ["grounding", "regulation", "coping"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,
    description: 'Identify dysregulation patterns and coping mechanisms',
    category: 'analysis',
    icon: 'activity',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    name: 'Relational Healing & Integration Analysis',
    promptText: `Examine relational healing and integration patterns in the transcript.

Focus on:
1. Attachment patterns (secure, anxious, avoidant, disorganized)
2. Relational wounds (past hurts, betrayals, losses)
3. Connection attempts (reaching out, vulnerability, trust)
4. Integration of parts (internal family systems, fragmented self)
5. Repair moments (in therapy relationship or external relationships)

Extract:
- Patterns in how the patient relates to others
- Moments of relational courage or risk
- Opportunities for healing through connection
- Integration work (bringing together split-off parts)

Suggest how to support relational healing in future sessions.

Output ONLY valid JSON:
{
  "schemaType": "therapeutic_note",
  "title": "Relational Healing & Integration Analysis",
  "content": "detailed analysis...",
  "tags": ["attachment", "relational", "integration"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,
    description: 'Analyze attachment patterns and relational healing opportunities',
    category: 'analysis',
    icon: 'users',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    name: 'Generate Reflection Questions',
    promptText: `Create thoughtful reflection questions for the patient based on the transcript.

Analyze the session themes and generate 3-5 open-ended questions that:
1. Invite deeper self-exploration
2. Build on insights from the session
3. Use strength-based language
4. Encourage narrative expansion
5. Connect past, present, and future

Output ONLY valid JSON:
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
  {
    name: 'Identify Metaphors & Symbols',
    promptText: `Extract natural metaphors and symbolic language from the transcript.

Look for:
1. Metaphors the patient uses naturally (not therapist-imposed)
2. Recurring symbols or imagery
3. Sensory descriptions (colors, textures, sounds)
4. Nature or landscape references
5. Journey/movement metaphors

Output ONLY valid JSON:
{
  "schemaType": "metaphor_extraction",
  "metaphors": [
    {
      "exact_language": "Patient's exact words",
      "symbolic_meaning": "Interpretation",
      "exploration_suggestions": "How to explore this",
      "visual_representation": "Proposed image concept"
    }
  ]
}`,
    description: 'Extract patient\'s natural metaphors and symbolic language',
    category: 'extraction',
    icon: 'eye',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['metaphor_extraction'] },
        metaphors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              exact_language: { type: 'string' },
              symbolic_meaning: { type: 'string' },
              exploration_suggestions: { type: 'string' },
              visual_representation: { type: 'string' },
            },
            required: ['exact_language', 'symbolic_meaning'],
          },
        },
      },
      required: ['schemaType', 'metaphors'],
    },
  },

  // === NEW ANALYSIS PROMPTS ===
  {
    name: 'Therapeutic Alliance Analysis',
    promptText: `Assess the quality and development of the therapeutic relationship based on the transcript.

Analyze for:
1. Trust indicators (what patient shares, how openly)
2. Rupture moments (misunderstandings, disconnections)
3. Repair attempts (reconnection, addressing issues)
4. Collaboration quality (shared goals, mutual respect)
5. Transference/countertransference hints

Output ONLY valid JSON:
{
  "schemaType": "therapeutic_note",
  "title": "Therapeutic Alliance Analysis",
  "content": "detailed analysis...",
  "tags": ["alliance", "relationship", "trust"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,
    description: 'Assess quality of therapeutic relationship and alliance indicators',
    category: 'analysis',
    icon: 'heart',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    name: 'Defense Mechanisms Analysis',
    promptText: `Identify psychological defense mechanisms in the transcript.

Look for signs of:
1. Denial (refusing to acknowledge reality)
2. Projection (attributing own feelings to others)
3. Rationalization (logical explanations for emotional issues)
4. Displacement (redirecting emotions to safer targets)
5. Intellectualization (avoiding emotions through analysis)
6. Reaction formation (expressing opposite of true feelings)
7. Humor/deflection (avoiding difficult topics)

Output ONLY valid JSON:
{
  "schemaType": "therapeutic_note",
  "title": "Defense Mechanisms Analysis",
  "content": "detailed analysis...",
  "tags": ["defense", "protection", "awareness"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,
    description: 'Identify defense patterns and their protective functions',
    category: 'analysis',
    icon: 'shield',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    name: 'Emotional Regulation Analysis',
    promptText: `Analyze emotion management strategies and regulation capacity.

Examine:
1. Emotional awareness (ability to name/describe feelings)
2. Emotional expression (how feelings are communicated)
3. Regulation strategies (healthy and unhealthy)
4. Emotional triggers and patterns
5. Window of tolerance (capacity range)

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

Required JSON fields:
- schemaType: "therapeutic_note"
- title: string (brief title for this analysis)
- content: string (full detailed analysis in markdown format)
- tags: array of strings
- keyInsights: array of strings
- actionItems: array of strings`,
    description: 'Analyze emotion management strategies and regulation capacity',
    category: 'analysis',
    icon: 'thermometer',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    name: 'Progress Tracking Analysis',
    promptText: `Evaluate therapeutic progress and development over time.

Compare current session to earlier work (if available) for:
1. Symptom reduction or management
2. Insight development
3. Behavior changes
4. Coping skill acquisition
5. Narrative shifts (how story is told differently)

Output ONLY valid JSON:
{
  "schemaType": "therapeutic_note",
  "title": "Progress Tracking Analysis",
  "content": "detailed analysis...",
  "tags": ["progress", "development", "growth"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,
    description: 'Evaluate therapeutic progress and development markers',
    category: 'analysis',
    icon: 'trending-up',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    name: 'Attachment Pattern Analysis',
    promptText: `Identify attachment styles and relational patterns in the transcript.

Analyze for indicators of:
1. Secure attachment (comfort with closeness and autonomy)
2. Anxious attachment (fear of abandonment, need for reassurance)
3. Avoidant attachment (discomfort with intimacy, self-reliance)
4. Disorganized attachment (contradictory behaviors, fear)

Output ONLY valid JSON:
{
  "schemaType": "therapeutic_note",
  "title": "Attachment Pattern Analysis",
  "content": "detailed analysis...",
  "tags": ["attachment", "relational", "patterns"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,
    description: 'Identify attachment styles and relational blueprints',
    category: 'analysis',
    icon: 'link',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    name: 'Trauma Response Analysis',
    promptText: `Recognize trauma indicators and post-traumatic responses in the transcript.

Watch for:
1. Hyperarousal (anxiety, hypervigilance, irritability)
2. Hypoarousal (numbing, dissociation, shutdown)
3. Intrusive memories or flashbacks
4. Avoidance patterns
5. Negative cognitions about self/world
6. Somatic symptoms

Output ONLY valid JSON:
{
  "schemaType": "therapeutic_note",
  "title": "Trauma Response Analysis",
  "content": "detailed analysis...",
  "tags": ["trauma", "ptsd", "resilience"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,
    description: 'Recognize trauma indicators and adaptive responses',
    category: 'analysis',
    icon: 'alert-triangle',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    name: 'Coping Strategy Assessment',
    promptText: `Map current coping mechanisms and adaptive strategies.

Identify:
1. Healthy coping (exercise, connection, creativity, etc.)
2. Maladaptive coping (avoidance, substances, self-harm, etc.)
3. Problem-focused vs emotion-focused strategies
4. Individual vs social coping
5. Coping flexibility and repertoire

Output ONLY valid JSON:
{
  "schemaType": "therapeutic_note",
  "title": "Coping Strategy Assessment",
  "content": "detailed analysis...",
  "tags": ["coping", "strategies", "resilience"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,
    description: 'Map current coping mechanisms and adaptive strategies',
    category: 'analysis',
    icon: 'tool',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },

  // === NEW JSON OUTPUT PROMPTS ===
  {
    name: 'Scene Card Generation',
    promptText: `Generate a complete therapeutic scene card in JSON format based on the transcript.

A scene card is a comprehensive therapeutic video visualization that includes reference images, background music, assembly instructions, and reflection questions.

Analyze the selected transcript segment and create a complete scene card with:

1. **Video Introduction** (2-3 sentences): Brief narration that sets the emotional tone and introduces the scene's therapeutic purpose.

2. **Reference Images** (3-5 images): Each with:
   - Title: Brief, evocative name
   - Patient Quote Anchor: Exact quote from transcript that inspired this image
   - Meaning: Therapeutic significance of this image
   - Image Prompt: DETAILED DALL-E/Flux generation prompt (2-3 sentences with specific visual elements, lighting, colors, composition, and mood)

3. **Background Music**: Specify mood, tempo, genre, and emotional purpose. Use descriptive music generation prompts.

4. **Patient Reflection Questions** (3-5 questions): Open-ended questions that:
   - Connect to the scene's themes
   - Encourage narrative exploration
   - Use strength-based language
   - Feel personal and authentic

5. **Group Reflection Questions** (2-3 questions, optional): For group therapy contexts.

6. **Assembly Steps**: Clear instructions for video editor showing how to sequence the images, timing, transitions, and music cues.

Output ONLY valid JSON matching the scene_card schema. No markdown, no explanations, just the JSON object.`,
    description: 'Generate complete therapeutic scene card with images, music, and reflections (JSON output)',
    category: 'creative',
    icon: 'film',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['scene_card'] },
        video_introduction: { type: 'string' },
        reference_images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              patient_quote_anchor: { type: 'string' },
              meaning: { type: 'string' },
              image_prompt: { type: 'string' },
            },
            required: ['title', 'image_prompt'],
          },
        },
        music: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            mood: { type: 'string' },
            genre: { type: 'string' },
          },
        },
        patient_reflection_questions: {
          type: 'array',
          items: { type: 'string' },
        },
        group_reflection_questions: {
          type: 'array',
          items: { type: 'string' },
        },
        assembly_steps: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['schemaType', 'video_introduction', 'reference_images'],
    },
  },
  {
    name: 'Scene Suggestions',
    promptText: `Analyze the transcript and suggest multiple therapeutic scenes that could be created for different participants.

Review the full transcript and identify key therapeutic moments, themes, and narratives for each participant. Generate scene suggestions organized by participant.

For each participant, create 2-4 scene suggestions with:

1. **Scene Title**: Evocative, specific title (e.g., "Journey Through the Storm")
2. **Scene Description**: 2-3 sentences describing what the scene would visualize
3. **Scene Focus Instruction**: Specific guidance for what therapeutic elements to emphasize
4. **Key Quote**: Most powerful quote from transcript that anchors this scene
5. **Therapeutic Rationale**: Why this scene would be healing/helpful (2-3 sentences)

Consider:
- Moments of insight or transformation
- Metaphors the patient used naturally
- Emotional turning points
- Strength and resilience demonstrations
- Hope and future-oriented themes
- Relational healing moments

Output ONLY valid JSON matching the scene_suggestions schema:
{
  "potential_scenes_by_participant": [
    {
      "for_patient_name": "Patient Name",
      "scenes": [
        {
          "scene_title": "...",
          "scene_description": "...",
          "scene_focus_instruction": "...",
          "key_quote": "...",
          "therapeutic_rationale": "..."
        }
      ]
    }
  ]
}

No markdown, no explanations, just the JSON object.`,
    description: 'Generate multiple scene suggestions for participants based on transcript (JSON output)',
    category: 'creative',
    icon: 'sparkles',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['scene_suggestions'] },
        potential_scenes_by_participant: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              for_patient_name: { type: 'string' },
              scenes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scene_title: { type: 'string' },
                    scene_description: { type: 'string' },
                    scene_focus_instruction: { type: 'string' },
                    key_quote: { type: 'string' },
                    therapeutic_rationale: { type: 'string' },
                  },
                  required: ['scene_title', 'scene_description', 'therapeutic_rationale'],
                },
              },
            },
            required: ['for_patient_name', 'scenes'],
          },
        },
      },
      required: ['schemaType', 'potential_scenes_by_participant'],
    },
  },
  {
    name: 'Music Generation Options',
    promptText: `Generate therapeutic music options (instrumental and lyrical) based on transcript themes.

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

Output ONLY valid JSON matching the music_generation schema. No markdown, no explanations.

Example structure:
{
  "instrumental_option": { ... },
  "lyrical_option": { ... }
}`,
    description: 'Generate instrumental and lyrical music options based on transcript (JSON output)',
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

  // === NEW CREATIVE PROMPTS ===
  {
    name: 'Generate Visual Metaphor',
    promptText: `Create symbolic image concepts that represent therapeutic themes.

Based on the transcript, design visual metaphors that:
1. Capture abstract concepts (healing, growth, struggle, hope)
2. Use powerful symbolism (nature, journey, transformation)
3. Resonate with patient's language and imagery
4. Empower and inspire
5. Can be understood without explanation

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

Output ONLY valid JSON:
{
  "schemaType": "visual_metaphor",
  "metaphors": [
    {
      "title": "Metaphor title",
      "dalle_prompt": "DETAILED generation prompt (2-3 sentences with visual specifics)",
      "symbolic_meaning": "Explanation",
      "connection_to_narrative": "How it connects"
    }
  ]
}`,
    description: 'Create symbolic image concepts representing therapeutic themes',
    category: 'creative',
    icon: 'palette',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['visual_metaphor'] },
        metaphors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              dalle_prompt: { type: 'string' },
              symbolic_meaning: { type: 'string' },
              connection_to_narrative: { type: 'string' },
            },
            required: ['title', 'dalle_prompt', 'symbolic_meaning'],
          },
        },
      },
      required: ['schemaType', 'metaphors'],
    },
  },
  {
    name: 'Story Reframe Suggestion',
    promptText: `Offer alternative narrative perspectives on the patient's story.

Analyze the dominant narrative and suggest reframes that:
1. Externalize problems (problem is separate from person)
2. Highlight agency and choice
3. Emphasize strengths over deficits
4. Connect to values and meaning
5. Open possibilities for the future

Output ONLY valid JSON:
{
  "schemaType": "story_reframe",
  "current_narrative": "Brief summary",
  "alternative_narratives": ["Reframe 1", "Reframe 2"],
  "supporting_evidence": ["Evidence 1", "Evidence 2"],
  "exploration_questions": ["Question 1", "Question 2"]
}`,
    description: 'Offer alternative narrative perspectives and reframes',
    category: 'creative',
    icon: 'refresh-cw',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['story_reframe'] },
        current_narrative: { type: 'string' },
        alternative_narratives: { type: 'array', items: { type: 'string' } },
        supporting_evidence: { type: 'array', items: { type: 'string' } },
        exploration_questions: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'current_narrative', 'alternative_narratives'],
    },
  },
  {
    name: 'Hope Visualization',
    promptText: `Visualize the patient's preferred future and aspirations.

Based on hopes, dreams, and goals mentioned, create:
1. Vivid description of preferred future
2. Concrete visual elements (setting, actions, relationships)
3. Emotional tone and atmosphere
4. Symbols of achievement and growth
5. Connection to current strengths

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

Output ONLY valid JSON:
{
  "schemaType": "hope_visualization",
  "future_description": "Vivid description",
  "dalle_prompt": "DETAILED generation prompt (2-3 sentences with visual specifics)",
  "pathway_steps": ["Step 1", "Step 2"],
  "affirmations": ["Affirmation 1", "Affirmation 2"]
}`,
    description: 'Visualize patient\'s preferred future and aspirations',
    category: 'creative',
    icon: 'sun',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['hope_visualization'] },
        future_description: { type: 'string' },
        dalle_prompt: { type: 'string' },
        pathway_steps: { type: 'array', items: { type: 'string' } },
        affirmations: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'future_description', 'dalle_prompt'],
    },
  },
  {
    name: 'Journey Map Creation',
    promptText: `Map the patient's therapeutic journey visually.

Create a visual journey map showing:
1. Where they started (presenting issues, initial state)
2. Key milestones (insights, breakthroughs, changes)
3. Obstacles overcome (challenges faced and conquered)
4. Current location (present state)
5. Direction forward (goals and aspirations)

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

Output ONLY valid JSON:
{
  "schemaType": "journey_map",
  "narrative_arc": "Description",
  "journey_metaphor": "Visual metaphor",
  "dalle_prompt": "DETAILED generation prompt (2-3 sentences with visual specifics)",
  "milestones": ["Milestone 1", "Milestone 2"]
}`,
    description: 'Map therapeutic journey from past through present to future',
    category: 'creative',
    icon: 'map',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['journey_map'] },
        narrative_arc: { type: 'string' },
        journey_metaphor: { type: 'string' },
        dalle_prompt: { type: 'string' },
        milestones: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'narrative_arc', 'dalle_prompt'],
    },
  },
  {
    name: 'Character Strength Portrait',
    promptText: `Identify and visualize the patient's core character strengths.

Based on the transcript, identify:
1. VIA character strengths displayed (wisdom, courage, humanity, justice, temperance, transcendence)
2. Signature strengths (most authentic, energizing)
3. Underused strengths (potential to develop)
4. Strengths in action (specific examples)

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

Output ONLY valid JSON:
{
  "schemaType": "character_strength",
  "strengths": [
    {
      "strength_name": "Name",
      "evidence": "Specific example",
      "category": "VIA category"
    }
  ],
  "dalle_prompt": "DETAILED generation prompt (2-3 sentences with visual specifics)",
  "leverage_suggestions": ["Suggestion 1", "Suggestion 2"]
}`,
    description: 'Identify and visualize patient\'s core character strengths',
    category: 'creative',
    icon: 'award',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['character_strength'] },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength_name: { type: 'string' },
              evidence: { type: 'string' },
              category: { type: 'string' },
            },
            required: ['strength_name', 'evidence'],
          },
        },
        dalle_prompt: { type: 'string' },
        leverage_suggestions: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'strengths'],
    },
  },
  {
    name: 'Timeline Visualization',
    promptText: `Create visual timeline of patient's therapeutic process.

Design a timeline showing:
1. Pre-therapy state
2. Key sessions and turning points
3. Interventions and their impact
4. Progress markers
5. Future milestones

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

Output ONLY valid JSON:
{
  "schemaType": "timeline_visualization",
  "narrative": "Chronological description",
  "visual_concept": "Timeline concept",
  "dalle_prompt": "DETAILED generation prompt (2-3 sentences with visual specifics)",
  "key_moments": [
    {
      "date": "Date/session",
      "event": "What happened",
      "significance": "Why it matters"
    }
  ]
}`,
    description: 'Create visual timeline of therapeutic process and progress',
    category: 'creative',
    icon: 'clock',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['timeline_visualization'] },
        narrative: { type: 'string' },
        visual_concept: { type: 'string' },
        dalle_prompt: { type: 'string' },
        key_moments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              event: { type: 'string' },
              significance: { type: 'string' },
            },
            required: ['event', 'significance'],
          },
        },
      },
      required: ['schemaType', 'narrative', 'dalle_prompt'],
    },
  },

  // === NEW EXTRACTION PROMPTS ===
  {
    name: 'Extract Key Moments',
    promptText: `Identify pivotal moments and turning points in the session.

Look for:
1. Moments of insight ("aha" moments)
2. Emotional breakthroughs
3. Behavior change commitments
4. Narrative shifts
5. Connections made (between past and present, feelings and thoughts)

Output ONLY valid JSON:
{
  "schemaType": "key_moments",
  "moments": [
    {
      "quote": "Exact quote or description",
      "significance": "Why it matters",
      "build_on": "How to build on it",
      "story_page_potential": true
    }
  ]
}`,
    description: 'Identify pivotal session moments and therapeutic turning points',
    category: 'extraction',
    icon: 'star',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['key_moments'] },
        moments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              significance: { type: 'string' },
              build_on: { type: 'string' },
              story_page_potential: { type: 'boolean' },
            },
            required: ['quote', 'significance'],
          },
        },
      },
      required: ['schemaType', 'moments'],
    },
  },
  {
    name: 'Extract Values & Beliefs',
    promptText: `Identify core values and belief systems expressed in the transcript.

Extract:
1. Stated values (what patient says matters)
2. Demonstrated values (what actions reveal)
3. Core beliefs about self
4. Core beliefs about others/world
5. Values conflicts or alignment

Output ONLY valid JSON:
{
  "schemaType": "values_beliefs",
  "values": [
    {
      "value_or_belief": "The value/belief",
      "supporting_quotes": ["Quote 1", "Quote 2"],
      "behavioral_influence": "How it influences behavior",
      "serves_patient": true,
      "alignment": "aligned|conflicted"
    }
  ]
}`,
    description: 'Identify core values and belief systems',
    category: 'extraction',
    icon: 'compass',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['values_beliefs'] },
        values: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value_or_belief: { type: 'string' },
              supporting_quotes: { type: 'array', items: { type: 'string' } },
              behavioral_influence: { type: 'string' },
              serves_patient: { type: 'boolean' },
              alignment: { type: 'string' },
            },
            required: ['value_or_belief', 'supporting_quotes'],
          },
        },
      },
      required: ['schemaType', 'values'],
    },
  },
  {
    name: 'Extract Goals & Intentions',
    promptText: `Pull out stated goals, intentions, and desired changes.

Identify:
1. Explicit goals stated by patient
2. Implicit goals (what they're moving toward)
3. Short-term vs long-term aspirations
4. Approach goals (what they want) vs avoidance goals (what they don't want)
5. SMART goal components (Specific, Measurable, Achievable, Relevant, Time-bound)

Output ONLY valid JSON:
{
  "schemaType": "goals_intentions",
  "goals": [
    {
      "goal": "Exact language",
      "type": "explicit|implicit",
      "timeframe": "short-term|long-term",
      "motivation_level": "1-10",
      "barriers": ["Barrier 1", "Barrier 2"],
      "action_steps": ["Step 1", "Step 2"]
    }
  ]
}`,
    description: 'Pull out stated goals, intentions, and desired changes',
    category: 'extraction',
    icon: 'crosshair',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['goals_intentions'] },
        goals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              type: { type: 'string' },
              timeframe: { type: 'string' },
              motivation_level: { type: 'string' },
              barriers: { type: 'array', items: { type: 'string' } },
              action_steps: { type: 'array', items: { type: 'string' } },
            },
            required: ['goal'],
          },
        },
      },
      required: ['schemaType', 'goals'],
    },
  },
  {
    name: 'Extract Strengths & Resources',
    promptText: `Identify personal assets, strengths, and resources mentioned.

Extract:
1. Personal strengths (resilience, creativity, determination, etc.)
2. Social support (relationships, community, family)
3. Material resources (financial stability, housing, etc.)
4. Spiritual/existential resources (faith, meaning, purpose)
5. Skills and competencies

Output ONLY valid JSON:
{
  "schemaType": "strengths_resources",
  "resources": [
    {
      "category": "personal|social|material|spiritual|skills",
      "resource": "The strength/resource",
      "demonstration": "How it's been shown",
      "healing_support": "How it can support healing",
      "leverage_opportunities": ["Opportunity 1", "Opportunity 2"]
    }
  ]
}`,
    description: 'Identify personal assets, strengths, and support systems',
    category: 'extraction',
    icon: 'battery-charging',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['strengths_resources'] },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              resource: { type: 'string' },
              demonstration: { type: 'string' },
              healing_support: { type: 'string' },
              leverage_opportunities: { type: 'array', items: { type: 'string' } },
            },
            required: ['resource', 'category'],
          },
        },
      },
      required: ['schemaType', 'resources'],
    },
  },
  {
    name: 'Extract Barriers & Challenges',
    promptText: `List obstacles, barriers, and challenges patient faces.

Identify:
1. Internal barriers (thoughts, feelings, patterns)
2. External barriers (circumstances, systems, people)
3. Skill deficits
4. Resource limitations
5. Systemic/structural challenges

Output ONLY valid JSON:
{
  "schemaType": "barriers_challenges",
  "barriers": [
    {
      "category": "internal|external|skill-deficit|resource|systemic",
      "barrier": "Specific description",
      "impact": "Impact on functioning",
      "current_approach": "How patient handles it",
      "interventions": ["Intervention 1", "Intervention 2"]
    }
  ]
}`,
    description: 'List obstacles and challenges requiring attention',
    category: 'extraction',
    icon: 'octagon',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['barriers_challenges'] },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              barrier: { type: 'string' },
              impact: { type: 'string' },
              current_approach: { type: 'string' },
              interventions: { type: 'array', items: { type: 'string' } },
            },
            required: ['barrier', 'category'],
          },
        },
      },
      required: ['schemaType', 'barriers'],
    },
  },

  // === NEW REFLECTION PROMPTS ===
  {
    name: 'Generate Between-Session Questions',
    promptText: `Create questions for patient reflection between sessions.

Based on session themes, generate 3-5 questions that:
1. Deepen insights from session
2. Encourage self-observation
3. Apply learning to daily life
4. Notice patterns and changes
5. Prepare for next session

Output ONLY valid JSON:
{
  "schemaType": "reflection_questions",
  "questions": [
    {
      "question": "The question",
      "rationale": "Why this matters",
      "connection_to_goals": "How it connects"
    }
  ]
}`,
    description: 'Create questions for reflection between sessions',
    category: 'reflection',
    icon: 'lightbulb',
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
              connection_to_goals: { type: 'string' },
            },
            required: ['question', 'rationale'],
          },
        },
      },
      required: ['schemaType', 'questions'],
    },
  },
  {
    name: 'Generate Journaling Prompts',
    promptText: `Create journaling prompts for therapeutic writing.

Generate 4-6 prompts that encourage:
1. Emotional expression and processing
2. Self-discovery and insight
3. Narrative exploration
4. Gratitude and strengths focus
5. Goal clarification
6. Meaning-making

Output ONLY valid JSON:
{
  "schemaType": "journaling_prompts",
  "prompts": [
    {
      "prompt": "The journaling prompt",
      "guidance": "Brief guidance",
      "therapeutic_objective": "What it supports"
    }
  ]
}`,
    description: 'Create therapeutic journaling prompts for self-exploration',
    category: 'reflection',
    icon: 'book-open',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['journaling_prompts'] },
        prompts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prompt: { type: 'string' },
              guidance: { type: 'string' },
              therapeutic_objective: { type: 'string' },
            },
            required: ['prompt'],
          },
        },
      },
      required: ['schemaType', 'prompts'],
    },
  },
  {
    name: 'Generate Goal-Setting Questions',
    promptText: `Help patient define and refine therapeutic goals.

Create questions that:
1. Clarify what patient truly wants
2. Explore motivation and values alignment
3. Identify concrete action steps
4. Anticipate obstacles
5. Measure progress

Output ONLY valid JSON:
{
  "schemaType": "goal_setting_questions",
  "questions": [
    {
      "question": "The question",
      "question_type": "miracle|scaling|exception-finding|values|future-oriented",
      "purpose": "What it clarifies"
    }
  ]
}`,
    description: 'Help patient define and refine therapeutic goals',
    category: 'reflection',
    icon: 'target',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['goal_setting_questions'] },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              question_type: { type: 'string' },
              purpose: { type: 'string' },
            },
            required: ['question'],
          },
        },
      },
      required: ['schemaType', 'questions'],
    },
  },
  {
    name: 'Generate Self-Compassion Prompts',
    promptText: `Create prompts that cultivate self-compassion and kindness.

Generate reflections that:
1. Counter self-criticism with understanding
2. Normalize suffering and struggle
3. Encourage self-kindness
4. Promote common humanity
5. Practice mindfulness of difficult emotions

Output ONLY valid JSON:
{
  "schemaType": "self_compassion_prompts",
  "prompts": [
    {
      "prompt": "The compassion prompt",
      "practice_type": "self-kindness|common-humanity|mindfulness",
      "guidance": "How to practice"
    }
  ]
}`,
    description: 'Cultivate self-compassion and self-kindness practices',
    category: 'reflection',
    icon: 'heart',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['self_compassion_prompts'] },
        prompts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prompt: { type: 'string' },
              practice_type: { type: 'string' },
              guidance: { type: 'string' },
            },
            required: ['prompt'],
          },
        },
      },
      required: ['schemaType', 'prompts'],
    },
  },
  {
    name: 'Generate Gratitude Prompts',
    promptText: `Foster gratitude practice and positive focus.

Create prompts that:
1. Notice small positive moments
2. Appreciate relationships and support
3. Recognize growth and learning
4. Find meaning in challenges
5. Express thanks for resources

Output ONLY valid JSON:
{
  "schemaType": "gratitude_prompts",
  "prompts": [
    {
      "prompt": "The gratitude prompt",
      "focus_area": "moments|relationships|growth|challenges|resources",
      "rationale": "Why this builds resilience"
    }
  ]
}`,
    description: 'Foster gratitude practice and positive awareness',
    category: 'reflection',
    icon: 'gift',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['gratitude_prompts'] },
        prompts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prompt: { type: 'string' },
              focus_area: { type: 'string' },
              rationale: { type: 'string' },
            },
            required: ['prompt'],
          },
        },
      },
      required: ['schemaType', 'prompts'],
    },
  },
  {
    name: 'Generate Homework Assignments',
    promptText: `Create therapeutic homework for between sessions.

Design 2-3 assignments that:
1. Apply session insights to real life
2. Build specific skills
3. Test new behaviors
4. Gather data or notice patterns
5. Prepare for next session

Output ONLY valid JSON:
{
  "schemaType": "homework_assignments",
  "assignments": [
    {
      "assignment": "The assignment",
      "rationale": "Why this matters",
      "guidance": "How to complete",
      "success_criteria": "What success looks like"
    }
  ]
}`,
    description: 'Create therapeutic homework and between-session practices',
    category: 'reflection',
    icon: 'clipboard-list',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['homework_assignments'] },
        assignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assignment: { type: 'string' },
              rationale: { type: 'string' },
              guidance: { type: 'string' },
              success_criteria: { type: 'string' },
            },
            required: ['assignment', 'rationale'],
          },
        },
      },
      required: ['schemaType', 'assignments'],
    },
  },
  {
    name: 'Generate Check-In Questions',
    promptText: `Create questions for ongoing progress monitoring.

Generate check-in questions for:
1. Symptom tracking (mood, anxiety, etc.)
2. Functioning assessment (work, relationships, self-care)
3. Goal progress review
4. Coping skill usage
5. Support system engagement

Output ONLY valid JSON:
{
  "schemaType": "check_in_questions",
  "questions": [
    {
      "question": "The question",
      "tracking_area": "symptoms|functioning|goals|coping|support",
      "response_format": "rating|yes-no|open-ended"
    }
  ]
}`,
    description: 'Create questions for ongoing progress monitoring and check-ins',
    category: 'reflection',
    icon: 'check-square',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['check_in_questions'] },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              tracking_area: { type: 'string' },
              response_format: { type: 'string' },
            },
            required: ['question', 'tracking_area'],
          },
        },
      },
      required: ['schemaType', 'questions'],
    },
  },
];

async function seedSystemPrompts() {
  try {
    console.log('🌱 Seeding system prompts...');

    // Get or create a system user (super admin)
    let systemUser = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.email, 'system@storycare.app'),
    });

    if (!systemUser) {
      console.log('Creating system user...');
      const result = await db
        .insert(usersSchema)
        .values({
          email: 'system@storycare.app',
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

    // Insert each prompt
    for (const promptData of systemPrompts) {
      try {
        const [existingPrompt] = await db
          .select()
          .from(moduleAiPromptsSchema)
          .where(eq(moduleAiPromptsSchema.name, promptData.name))
          .limit(1);

        if (existingPrompt) {
          console.log(`⏭️  Skipping "${promptData.name}" (already exists)`);
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
