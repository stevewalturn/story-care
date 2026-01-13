/**
 * Delete Script: Remove All Therapist Private Prompts
 * Deletes all prompts with scope='private' (therapist-owned prompts)
 *
 * Usage: npx tsx scripts/delete-therapist-prompts.ts
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

async function deleteTherapistPrompts() {
  try {
    console.log('🗑️  Deleting all therapist-owned (private) prompts...\n');

    // First, get count of prompts to delete
    const promptsToDelete = await db
      .select({
        id: moduleAiPromptsSchema.id,
        name: moduleAiPromptsSchema.name,
        category: moduleAiPromptsSchema.category,
      })
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, 'private'));

    if (promptsToDelete.length === 0) {
      console.log('✅ No private prompts found to delete.');
      await pool.end();
      process.exit(0);
    }

    console.log(`Found ${promptsToDelete.length} private prompt(s) to delete:\n`);

    // List prompts that will be deleted
    for (const prompt of promptsToDelete) {
      console.log(`  - "${prompt.name}" (${prompt.category})`);
    }

    console.log('');

    // Delete all private prompts
    const result = await db
      .delete(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, 'private'))
      .returning({ id: moduleAiPromptsSchema.id, name: moduleAiPromptsSchema.name });

    console.log(`✅ Successfully deleted ${result.length} therapist-owned prompt(s).`);
    console.log('');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Delete failed:', error);
    await pool.end();
    process.exit(1);
  }
}

deleteTherapistPrompts();
