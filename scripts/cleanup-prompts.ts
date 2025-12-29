/**
 * Cleanup Script: Remove All Prompts Except Essential Ones
 * Keeps only 7 essential system prompts and removes the rest
 */

import * as dotenv from 'dotenv';
import { and, eq, inArray } from 'drizzle-orm';
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

// Prompts to KEEP (7 essential prompts)
const PROMPTS_TO_KEEP = [
  'Generate Reflection Questions',
  'Therapeutic Alliance Analysis',
  'Music Generation Options',
  'Potential Images',
  'Extract Meaningful Quotes',
  'Self-Resilience & Re-Authoring Analysis', // Will be renamed to "Therapeutic Note"
  'Session Summary',
];

async function cleanupPrompts() {
  try {
    console.log('🧹 Starting prompt library cleanup...\n');

    // 1. Get all system prompts
    const allSystemPrompts = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, 'system'));

    console.log(`📊 Found ${allSystemPrompts.length} system prompts in database\n`);

    // 2. Identify prompts to keep vs delete
    const promptsToKeep = allSystemPrompts.filter(p =>
      PROMPTS_TO_KEEP.includes(p.name),
    );
    const promptsToDelete = allSystemPrompts.filter(
      p => !PROMPTS_TO_KEEP.includes(p.name),
    );

    console.log(`✅ Keeping ${promptsToKeep.length} prompts:`);
    promptsToKeep.forEach((p) => {
      console.log(`   - ${p.name} (${p.category})`);
    });

    console.log(`\n🗑️  Deleting ${promptsToDelete.length} prompts:`);
    promptsToDelete.forEach((p) => {
      console.log(`   - ${p.name} (${p.category})`);
    });

    // 3. Confirm deletion
    if (promptsToDelete.length === 0) {
      console.log('\n✨ No prompts to delete. Database is already clean!');
      await pool.end();
      process.exit(0);
    }

    console.log(`\n⚠️  About to delete ${promptsToDelete.length} prompts...`);

    // 4. Delete prompts (cascade will handle module_prompt_links)
    const promptIdsToDelete = promptsToDelete.map(p => p.id);

    const deleteResult = await db
      .delete(moduleAiPromptsSchema)
      .where(
        and(
          eq(moduleAiPromptsSchema.scope, 'system'),
          inArray(moduleAiPromptsSchema.id, promptIdsToDelete),
        ),
      )
      .returning();

    console.log(`\n✅ Deleted ${deleteResult.length} prompts successfully!`);

    // 5. Verify final state
    const remainingPrompts = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, 'system'));

    console.log(`\n📊 Final state: ${remainingPrompts.length} system prompts remaining`);
    remainingPrompts.forEach((p) => {
      console.log(`   ✓ ${p.name} (${p.category}, ${p.outputType})`);
    });

    console.log('\n✨ Cleanup complete!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    await pool.end();
    process.exit(1);
  }
}

cleanupPrompts();
