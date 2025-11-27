#!/usr/bin/env tsx

/**
 * Add Video Generation Prompt
 * Adds a new system prompt for generating video references from transcript analysis
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';

import { eq } from 'drizzle-orm';
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

const videoPrompt = {
  name: 'Potential Videos',
  promptText: `Generate video suggestions based on transcript themes, metaphors, and emotional narratives.

Analyze the selected text for:
1. Natural metaphors or visual imagery the patient uses
2. Emotional journeys or transformations described
3. Motion, change, or progression themes
4. Symbolic moments that could be visualized
5. Settings or environments that could come alive

Suggest 3-5 short video concepts (5-10 seconds each) with detailed generation prompts.

**IMPORTANT**: The "prompt" field must contain a complete, detailed video generation prompt suitable for Atlas Cloud SeeDance or similar video generation models. This should be 2-3 sentences describing:
- What visual elements should appear and how they move
- Camera movement or perspective changes
- Lighting, colors, and atmosphere evolution
- Specific motion, transformation, or progression
- Artistic style and mood
- Starting composition to ending state

Example:
{
  "title": "Emerging from the Shadows",
  "prompt": "A silhouetted figure stands in darkness, facing away from camera. Slowly, warm golden light begins to illuminate them from above, revealing details and color as they gradually turn to face the light. The camera slowly orbits around them as the transformation happens, ending with the figure bathed in warm light, their face serene and hopeful. Cinematic, photorealistic style with dramatic lighting contrast.",
  "duration": 8,
  "style": "cinematic",
  "therapeutic_purpose": "To visualize the patient's journey from depression toward hope and self-acceptance",
  "source_quote": "I feel like I'm finally starting to see myself differently",
  "motion_description": "Figure rotates slowly, light grows from dim to bright, camera orbits smoothly"
}

Output ONLY valid JSON:
{
  "schemaType": "video_references",
  "videos": [
    {
      "title": "Video title",
      "prompt": "DETAILED generation prompt (2-3 sentences with specific visuals, motion, camera work, lighting progression, and mood)",
      "duration": 5,
      "style": "cinematic",
      "therapeutic_purpose": "Why this video empowers/heals",
      "source_quote": "Quote that inspired this",
      "motion_description": "Brief description of key motion/transformation"
    }
  ]
}`,
  category: 'creative',
  outputType: 'json_schema',
  jsonSchema: 'video_references',
};

async function addVideoPrompt() {
  console.log('🎬 Adding Video Generation Prompt...\n');

  try {
    // Get system user
    const [systemUser] = await db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.email, 'system@storycare.app'))
      .limit(1);

    if (!systemUser) {
      console.error('❌ System user not found. Please run the main seed script first.');
      process.exit(1);
    }

    console.log(`Using system user: ${systemUser.email} (${systemUser.id})\n`);

    // Check if already exists
    const [existing] = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.name, videoPrompt.name))
      .limit(1);

    if (existing) {
      console.log(`⏭️  "${videoPrompt.name}" already exists. Updating...`);

      await db
        .update(moduleAiPromptsSchema)
        .set({
          promptText: videoPrompt.promptText,
          category: videoPrompt.category,
          outputType: videoPrompt.outputType,
          jsonSchema: videoPrompt.jsonSchema,
        })
        .where(eq(moduleAiPromptsSchema.id, existing.id));

      console.log(`✅ Updated: "${videoPrompt.name}"`);
    } else {
      const result = await db
        .insert(moduleAiPromptsSchema)
        .values({
          ...videoPrompt,
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
    }

    console.log('\n✨ Video generation prompt added successfully!');
    console.log('\n📝 You can now use "Potential Videos" in the AI Assistant to generate video concepts.');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

addVideoPrompt();
