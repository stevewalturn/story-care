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
    promptText: '', // DEPRECATED: Use systemPrompt instead
    systemPrompt: `Read the transcript carefully. Locate passages about struggle, adversity, and survival. Extract moments where the person demonstrated resilience, agency, or strength - even in small ways.

Focus on:
1. Externalizing problems (the problem is not the person)
2. Internalizing strengths (the person has inherent capabilities)
3. Alternative narratives (other possible interpretations)
4. Unique outcomes (times they acted differently than the problem would predict)

Extract 2-3 meaningful quotes that show resilience. Summarize therapeutic themes in 2-3 sentences. Suggest visual scenes or metaphors that capture their journey of survival and strength.

CRITICAL: Output ONLY valid JSON matching this schema:
{
  "schemaType": "therapeutic_note",
  "note_title": "Brief title",
  "note_content": "Full analysis in markdown format",
  "key_themes": ["theme1", "theme2"],
  "tags": ["tag1", "tag2"]
}`,
    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Generate a therapeutic scene card with 3-5 scenes from the transcript.

Analyze the transcript and create a therapeutic scene card with multiple scenes that capture key moments in the patient's journey.

**IMPORTANT INSTRUCTIONS:**
1. Generate 3-5 scenes minimum (or as many as requested by the user)
2. Each scene should capture a pivotal therapeutic moment
3. Extract EXACT quotes from the transcript (do not paraphrase)
4. Create detailed DALL-E/Flux image generation prompts (2-3 sentences each)
5. Explain the therapeutic significance of each moment

**Scene Structure - Each scene MUST have:**
- **Patient Quote**: Exact quote from transcript that anchors this scene
- **Meaning**: Therapeutic significance (what it reveals about the patient's journey)
- **Image Prompt**: Detailed DALL-E/Flux prompt with:
  * Specific visual composition and framing
  * Lighting quality, colors, and atmosphere
  * Concrete elements and their spatial arrangement
  * Artistic style and emotional mood (photorealistic, artistic, etc.)
  * 2-3 sentences with rich visual details
- **Image to Scene**: How this image connects to the therapeutic narrative

**CRITICAL: Output ONLY valid JSON matching the therapeutic_scene_card schema. No markdown, no explanations, just the JSON object.**

The JSON structure MUST be:
{
  "type": "therapeutic_scene_card",
  "schemaType": "therapeutic_scene_card",
  "title": "Brief, evocative title for the overall scene card",
  "subtitle": "Additional context (optional)",
  "patient": "Patient name from transcript",
  "scenes": [
    {
      "sceneNumber": 1,
      "sections": {
        "patientQuote": { "label": "Patient Quote", "content": "exact quote from transcript" },
        "meaning": { "label": "Meaning", "content": "therapeutic significance of this moment" },
        "imagePrompt": { "label": "Image Prompt", "content": "Detailed DALL-E/Flux prompt: [2-3 sentences with composition, lighting, colors, elements, style]" },
        "imageToScene": { "label": "Image to Scene", "content": "how this visual represents the therapeutic narrative" }
      }
    },
    {
      "sceneNumber": 2,
      "sections": {
        "patientQuote": { "label": "Patient Quote", "content": "..." },
        "meaning": { "label": "Meaning", "content": "..." },
        "imagePrompt": { "label": "Image Prompt", "content": "..." },
        "imageToScene": { "label": "Image to Scene", "content": "..." }
      }
    }
  ],
  "status": "completed"
}`,

    userPrompt: null,
    description: 'Generate therapeutic scene card with multiple navigable scenes (opens Scene Generation Workspace)',
    category: 'creative',
    icon: 'sparkles',
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
                  },
                  meaning: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      content: { type: 'string' },
                    },
                  },
                  imagePrompt: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      content: { type: 'string' },
                    },
                  },
                  imageToScene: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      content: { type: 'string' },
                    },
                  },
                },
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
  {
    name: 'Grounding & Regulation Analysis',
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Identify grounding and emotional regulation opportunities in the transcript.

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

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "therapeutic_note",
  "title": "Grounding & Regulation Analysis",
  "content": "detailed therapeutic analysis...",
  "tags": ["grounding", "regulation", "coping"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Examine relational healing and integration patterns in the transcript.

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

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "therapeutic_note",
  "title": "Relational Healing & Integration Analysis",
  "content": "detailed analysis...",
  "tags": ["attachment", "relational", "integration"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,

    userPrompt: null,
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
  {
    name: 'Identify Metaphors & Symbols',
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Extract natural metaphors and symbolic language from the transcript.

Look for:
1. Metaphors the patient uses naturally (not therapist-imposed)
2. Recurring symbols or imagery
3. Sensory descriptions (colors, textures, sounds)
4. Nature or landscape references
5. Journey/movement metaphors

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Assess the quality and development of the therapeutic relationship based on the transcript.

Analyze for:
1. Trust indicators (what patient shares, how openly)
2. Rupture moments (misunderstandings, disconnections)
3. Repair attempts (reconnection, addressing issues)
4. Collaboration quality (shared goals, mutual respect)
5. Transference/countertransference hints

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "therapeutic_note",
  "title": "Therapeutic Alliance Analysis",
  "content": "detailed analysis...",
  "tags": ["alliance", "relationship", "trust"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Identify psychological defense mechanisms in the transcript.

Look for signs of:
1. Denial (refusing to acknowledge reality)
2. Projection (attributing own feelings to others)
3. Rationalization (logical explanations for emotional issues)
4. Displacement (redirecting emotions to safer targets)
5. Intellectualization (avoiding emotions through analysis)
6. Reaction formation (expressing opposite of true feelings)
7. Humor/deflection (avoiding difficult topics)

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "therapeutic_note",
  "title": "Defense Mechanisms Analysis",
  "content": "detailed analysis...",
  "tags": ["defense", "protection", "awareness"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Analyze emotion management strategies and regulation capacity.

Examine:
1. Emotional awareness (ability to name/describe feelings)
2. Emotional expression (how feelings are communicated)
3. Regulation strategies (healthy and unhealthy)
4. Emotional triggers and patterns
5. Window of tolerance (capacity range)

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.

Required JSON fields:
- schemaType: "therapeutic_note"
- title: string (brief title for this analysis)
- content: string (full detailed analysis in markdown format)
- tags: array of strings
- keyInsights: array of strings
- actionItems: array of strings`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Evaluate therapeutic progress and development over time.

Compare current session to earlier work (if available) for:
1. Symptom reduction or management
2. Insight development
3. Behavior changes
4. Coping skill acquisition
5. Narrative shifts (how story is told differently)

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "therapeutic_note",
  "title": "Progress Tracking Analysis",
  "content": "detailed analysis...",
  "tags": ["progress", "development", "growth"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Identify attachment styles and relational patterns in the transcript.

Analyze for indicators of:
1. Secure attachment (comfort with closeness and autonomy)
2. Anxious attachment (fear of abandonment, need for reassurance)
3. Avoidant attachment (discomfort with intimacy, self-reliance)
4. Disorganized attachment (contradictory behaviors, fear)

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "therapeutic_note",
  "title": "Attachment Pattern Analysis",
  "content": "detailed analysis...",
  "tags": ["attachment", "relational", "patterns"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Recognize trauma indicators and post-traumatic responses in the transcript.

Watch for:
1. Hyperarousal (anxiety, hypervigilance, irritability)
2. Hypoarousal (numbing, dissociation, shutdown)
3. Intrusive memories or flashbacks
4. Avoidance patterns
5. Negative cognitions about self/world
6. Somatic symptoms

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "therapeutic_note",
  "title": "Trauma Response Analysis",
  "content": "detailed analysis...",
  "tags": ["trauma", "ptsd", "resilience"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Map current coping mechanisms and adaptive strategies.

Identify:
1. Healthy coping (exercise, connection, creativity, etc.)
2. Maladaptive coping (avoidance, substances, self-harm, etc.)
3. Problem-focused vs emotion-focused strategies
4. Individual vs social coping
5. Coping flexibility and repertoire

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "therapeutic_note",
  "title": "Coping Strategy Assessment",
  "content": "detailed analysis...",
  "tags": ["coping", "strategies", "resilience"],
  "keyInsights": ["insight 1", "insight 2"],
  "actionItems": ["action 1", "action 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Generate a therapeutic scene card in JSON format based on the transcript.

Analyze the transcript and create a therapeutic scene card with multiple scenes that capture key moments in the patient's journey.

Structure your response as follows:

1. **Title**: Brief, evocative title for the overall therapeutic scene card
2. **Subtitle** (optional): Additional context
3. **Patient**: Patient name
4. **Scenes** (3-5 scenes): Each scene should have:
   - **Scene Number**: Sequential number
   - **Patient Quote**: A powerful, exact quote from the transcript that anchors this scene
   - **Meaning**: Therapeutic significance of this moment (what it reveals about the patient's journey)
   - **Image Prompt**: Detailed DALL-E/Flux prompt for generating a therapeutic image (2-3 sentences with specific visual elements, mood, lighting, colors)
   - **Image to Scene**: How this image connects to the therapeutic narrative (what story it tells)

5. **Status**: Set to "completed"

CRITICAL: Output ONLY valid JSON matching the therapeutic_scene_card schema. No markdown, no explanations, just the JSON object.

The JSON structure must be:
{
  "type": "therapeutic_scene_card",
  "schemaType": "therapeutic_scene_card",
  "title": "...",
  "subtitle": "...",
  "patient": "...",
  "scenes": [
    {
      "sceneNumber": 1,
      "sections": {
        "patientQuote": { "label": "Patient Quote", "content": "exact quote from transcript" },
        "meaning": { "label": "Meaning", "content": "therapeutic significance" },
        "imagePrompt": { "label": "Image Prompt", "content": "detailed DALL-E prompt" },
        "imageToScene": { "label": "Image to Scene", "content": "narrative connection" }
      }
    }
  ],
  "status": "completed"
}`,

    userPrompt: null,
    description: 'Generate therapeutic scene card with navigable scenes (JSON output)',
    category: 'creative',
    icon: 'film',
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
                  },
                  meaning: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      content: { type: 'string' },
                    },
                  },
                  imagePrompt: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      content: { type: 'string' },
                    },
                  },
                  imageToScene: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      content: { type: 'string' },
                    },
                  },
                },
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
  {
    name: 'Scene Suggestions',
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Analyze the transcript and suggest multiple therapeutic scenes that could be created for different participants.

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

CRITICAL: Output ONLY valid JSON matching the scene_suggestions schema:
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Create symbolic image concepts that represent therapeutic themes.

Based on the transcript, design visual metaphors that:
1. Capture abstract concepts (healing, growth, struggle, hope)
2. Use powerful symbolism (nature, journey, transformation)
3. Resonate with patient's language and imagery
4. Empower and inspire
5. Can be understood without explanation

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Offer alternative narrative perspectives on the patient's story.

Analyze the dominant narrative and suggest reframes that:
1. Externalize problems (problem is separate from person)
2. Highlight agency and choice
3. Emphasize strengths over deficits
4. Connect to values and meaning
5. Open possibilities for the future

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "story_reframe",
  "current_narrative": "Brief summary",
  "alternative_narratives": ["Reframe 1", "Reframe 2"],
  "supporting_evidence": ["Evidence 1", "Evidence 2"],
  "exploration_questions": ["Question 1", "Question 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Visualize the patient's preferred future and aspirations.

Based on hopes, dreams, and goals mentioned, create:
1. Vivid description of preferred future
2. Concrete visual elements (setting, actions, relationships)
3. Emotional tone and atmosphere
4. Symbols of achievement and growth
5. Connection to current strengths

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "hope_visualization",
  "future_description": "Vivid description",
  "dalle_prompt": "DETAILED generation prompt (2-3 sentences with visual specifics)",
  "pathway_steps": ["Step 1", "Step 2"],
  "affirmations": ["Affirmation 1", "Affirmation 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Map the patient's therapeutic journey visually.

Create a visual journey map showing:
1. Where they started (presenting issues, initial state)
2. Key milestones (insights, breakthroughs, changes)
3. Obstacles overcome (challenges faced and conquered)
4. Current location (present state)
5. Direction forward (goals and aspirations)

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
{
  "schemaType": "journey_map",
  "narrative_arc": "Description",
  "journey_metaphor": "Visual metaphor",
  "dalle_prompt": "DETAILED generation prompt (2-3 sentences with visual specifics)",
  "milestones": ["Milestone 1", "Milestone 2"]
}`,

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Identify and visualize the patient's core character strengths.

Based on the transcript, identify:
1. VIA character strengths displayed (wisdom, courage, humanity, justice, temperance, transcendence)
2. Signature strengths (most authentic, energizing)
3. Underused strengths (potential to develop)
4. Strengths in action (specific examples)

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Create visual timeline of patient's therapeutic process.

Design a timeline showing:
1. Pre-therapy state
2. Key sessions and turning points
3. Interventions and their impact
4. Progress markers
5. Future milestones

**IMPORTANT**: The "dalle_prompt" field must be a complete, detailed image generation prompt (2-3 sentences with specific visual elements, composition, lighting, colors, and style).

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Identify pivotal moments and turning points in the session.

Look for:
1. Moments of insight ("aha" moments)
2. Emotional breakthroughs
3. Behavior change commitments
4. Narrative shifts
5. Connections made (between past and present, feelings and thoughts)

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Identify core values and belief systems expressed in the transcript.

Extract:
1. Stated values (what patient says matters)
2. Demonstrated values (what actions reveal)
3. Core beliefs about self
4. Core beliefs about others/world
5. Values conflicts or alignment

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Pull out stated goals, intentions, and desired changes.

Identify:
1. Explicit goals stated by patient
2. Implicit goals (what they're moving toward)
3. Short-term vs long-term aspirations
4. Approach goals (what they want) vs avoidance goals (what they don't want)
5. SMART goal components (Specific, Measurable, Achievable, Relevant, Time-bound)

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Identify personal assets, strengths, and resources mentioned.

Extract:
1. Personal strengths (resilience, creativity, determination, etc.)
2. Social support (relationships, community, family)
3. Material resources (financial stability, housing, etc.)
4. Spiritual/existential resources (faith, meaning, purpose)
5. Skills and competencies

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `List obstacles, barriers, and challenges patient faces.

Identify:
1. Internal barriers (thoughts, feelings, patterns)
2. External barriers (circumstances, systems, people)
3. Skill deficits
4. Resource limitations
5. Systemic/structural challenges

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    name: 'Create Therapeutic Reflection Questions',
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Generate thoughtful, therapeutic reflection questions based on the transcript that can be saved to the template library for reuse.

Analyze the session carefully and create 5-8 high-quality reflection questions that:
1. **Invite deeper self-exploration** - Open-ended questions that encourage insight
2. **Build on session insights** - Connect to themes discussed in therapy
3. **Use strength-based language** - Focus on capabilities, not deficits
4. **Encourage narrative expansion** - Help patient tell richer stories
5. **Connect past, present, future** - Link experiences across time
6. **Are adaptable** - Can be used with other similar patients/themes

**Question Design Guidelines:**
- Start with "What" or "How" (avoid "Why" which can feel interrogative)
- Be specific enough to guide, broad enough to allow personal interpretation
- Use patient's own language and metaphors when possible
- Balance emotional exploration with practical application
- Include both individual and group variations when applicable

**Format your response as JSON with these fields:**
- **patient_questions**: Array of 5-8 questions for individual reflection
- **group_questions** (optional): Array of 2-3 questions adapted for group discussion
- **context**: Brief description of when/how to use these questions (helps with template categorization)

CRITICAL: Output ONLY valid JSON matching this exact schema:
{
  "schemaType": "reflection_questions",
  "patient_questions": [
    "What did you discover about yourself in this moment?",
    "How does this realization change the way you see your story?"
  ],
  "group_questions": [
    "How can we support each other in similar situations?"
  ],
  "context": "For use after discussing breakthrough moments or narrative shifts"
}

No markdown, no explanations, just the JSON object.`,

    userPrompt: null,
    description: 'Generate therapeutic reflection questions optimized for template library (can be saved and reused)',
    category: 'reflection',
    icon: 'message-circle',
    outputType: 'json',
    jsonSchema: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['reflection_questions'] },
        patient_questions: { type: 'array', items: { type: 'string' } },
        group_questions: { type: 'array', items: { type: 'string' } },
        context: { type: 'string' },
      },
      required: ['schemaType', 'patient_questions'],
    },
  },
  {
    name: 'Generate Between-Session Questions',
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Create questions for patient reflection between sessions.

Based on session themes, generate 3-5 questions that:
1. Deepen insights from session
2. Encourage self-observation
3. Apply learning to daily life
4. Notice patterns and changes
5. Prepare for next session

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Create journaling prompts for therapeutic writing.

Generate 4-6 prompts that encourage:
1. Emotional expression and processing
2. Self-discovery and insight
3. Narrative exploration
4. Gratitude and strengths focus
5. Goal clarification
6. Meaning-making

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Help patient define and refine therapeutic goals.

Create questions that:
1. Clarify what patient truly wants
2. Explore motivation and values alignment
3. Identify concrete action steps
4. Anticipate obstacles
5. Measure progress

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Create prompts that cultivate self-compassion and kindness.

Generate reflections that:
1. Counter self-criticism with understanding
2. Normalize suffering and struggle
3. Encourage self-kindness
4. Promote common humanity
5. Practice mindfulness of difficult emotions

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Foster gratitude practice and positive focus.

Create prompts that:
1. Notice small positive moments
2. Appreciate relationships and support
3. Recognize growth and learning
4. Find meaning in challenges
5. Express thanks for resources

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Create therapeutic homework for between sessions.

Design 2-3 assignments that:
1. Apply session insights to real life
2. Build specific skills
3. Test new behaviors
4. Gather data or notice patterns
5. Prepare for next session

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
    promptText: '', // DEPRECATED: Use systemPrompt instead

    systemPrompt: `Create questions for ongoing progress monitoring.

Generate check-in questions for:
1. Symptom tracking (mood, anxiety, etc.)
2. Functioning assessment (work, relationships, self-care)
3. Goal progress review
4. Coping skill usage
5. Support system engagement

CRITICAL: Output ONLY valid JSON. No explanatory text before or after. Start with { and end with }.

IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field. This is required for proper rendering.
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

    userPrompt: null,
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
