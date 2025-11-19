/**
 * Seed Script: System-Level AI Prompts
 * Creates default system prompts available to all users
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Import drizzle and pg directly to bypass Env validation
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { moduleAiPromptsSchema, usersSchema } from '../src/models/Schema';
import { eq } from 'drizzle-orm';
import * as schema from '../src/models/Schema';

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

Extract 2-3 meaningful quotes that show resilience. Summarize therapeutic themes in 2-3 sentences. Suggest visual scenes or metaphors that capture their journey of survival and strength.`,
    description: 'Analyze for moments of personal agency, strength, and alternative narratives',
    category: 'analysis',
    icon: 'target',
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

Format as a detailed DALL-E prompt that could generate an image representing this therapeutic moment. Include specific details about composition, mood, and symbolic elements.`,
    description: 'Generate therapeutic scene visualization from transcript moments',
    category: 'creative',
    icon: 'sparkles',
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

Extract 3-5 quotes with context:
- The exact quote
- Why it's therapeutically significant
- How it connects to larger themes
- Suggested use in story page

Format each quote with attribution (timestamp or session date).`,
    description: 'AI extracts therapeutically meaningful quotes with context',
    category: 'extraction',
    icon: 'quote',
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

Suggest 3-5 image concepts that could visualize these themes:
- Brief title for the image
- Detailed DALL-E prompt
- Rationale (why this image supports the therapeutic narrative)
- Suggested placement in story page

Focus on images that empower, heal, or reframe the patient's story.`,
    description: 'Generate image suggestions based on transcript themes and metaphors',
    category: 'creative',
    icon: 'image',
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

Provide therapeutic insights for helping the patient build regulation capacity.`,
    description: 'Identify dysregulation patterns and coping mechanisms',
    category: 'analysis',
    icon: 'activity',
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

Suggest how to support relational healing in future sessions.`,
    description: 'Analyze attachment patterns and relational healing opportunities',
    category: 'analysis',
    icon: 'users',
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

Format each question with:
- The question itself
- Therapeutic rationale (why this question matters)
- Suggested placement (timing in story page)

Questions should feel personal, not generic - use language and themes from the patient's own narrative.`,
    description: 'Generate personalized reflection questions for story pages',
    category: 'reflection',
    icon: 'message-circle',
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

For each metaphor identified:
- Extract the exact language used
- Interpret the symbolic meaning
- Suggest how to expand or explore this metaphor
- Propose visual representations

These metaphors can become powerful elements in story pages and therapeutic conversations.`,
    description: 'Extract patient\'s natural metaphors and symbolic language',
    category: 'extraction',
    icon: 'eye',
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
