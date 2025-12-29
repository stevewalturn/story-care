/**
 * Update Script: Update "Potential Images" prompt to include description field
 */

import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { moduleAiPromptsSchema } from '../src/models/Schema';
import * as schema from '../src/models/Schema';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function updateImagePrompt() {
  try {
    console.log('🔍 Finding "Potential Images" prompt...\n');

    // Find the "Potential Images" prompt
    const prompts = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.name, 'Potential Images'));

    if (prompts.length === 0) {
      console.log('❌ Prompt "Potential Images" not found');
      await pool.end();
      process.exit(1);
    }

    const prompt = prompts[0];
    console.log('✅ Found prompt:', prompt?.name);
    console.log('   Current category:', prompt?.category);
    console.log('   Current output type:', prompt?.outputType);

    const newSystemPrompt = `Generate image suggestions based on transcript themes and metaphors.

Analyze the selected text for:
1. Natural metaphors the patient uses
2. Emotional states described
3. Relationships and connections
4. Transformation or change themes
5. Settings or environments mentioned

Suggest 3-5 image concepts with detailed generation prompts.

**IMPORTANT**: Each image must include:
- title: A short, evocative title (e.g., "Breaking Free from Boredom")
- description: A human-readable description of the image concept (2-3 sentences describing what the viewer will see)
- prompt: A detailed DALL-E/Flux prompt (technical, for image generation)
- therapeutic_purpose: Why this image is therapeutically relevant
- source_quote: The patient quote that inspired this image

CRITICAL: Output ONLY valid JSON. No explanatory text. Start with { and end with }.
IMPORTANT: The JSON MUST start with "schemaType" as the FIRST field.

Example structure:
{
  "schemaType": "image_references",
  "images": [
    {
      "title": "Breaking Free from Boredom",
      "description": "A young person breaking through a gray wall into a colorful world, symbolizing the desire to escape monotony and find meaning.",
      "prompt": "A person breaking through a crumbling gray concrete wall, vibrant colors streaming through the crack. Dramatic lighting, photorealistic style, hopeful atmosphere.",
      "style": "photorealistic",
      "therapeutic_purpose": "Visualizing transformation and the possibility of breaking out of stagnation",
      "source_quote": "Everything just feels so boring and meaningless"
    }
  ]
}`;

    const newJsonSchema = {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['image_references'] },
        images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              prompt: { type: 'string' },
              style: { type: 'string' },
              therapeutic_purpose: { type: 'string' },
              source_quote: { type: 'string' },
            },
            required: ['title', 'description', 'prompt', 'therapeutic_purpose'],
          },
        },
      },
      required: ['schemaType', 'images'],
    };

    console.log('\n📝 Updating prompt...');

    await db
      .update(moduleAiPromptsSchema)
      .set({
        systemPrompt: newSystemPrompt,
        jsonSchema: newJsonSchema,
        updatedAt: new Date(),
      })
      .where(eq(moduleAiPromptsSchema.name, 'Potential Images'));

    console.log('✅ Updated "Potential Images" prompt successfully!');
    console.log('\n📋 Changes made:');
    console.log('   - Added "description" field requirement');
    console.log('   - Updated system prompt with example structure');
    console.log('   - Updated JSON schema validation');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    await pool.end();
    process.exit(1);
  }
}

updateImagePrompt();
