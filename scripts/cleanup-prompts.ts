/**
 * Cleanup Script: Remove all system prompts
 * This allows re-seeding with updated configurations
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

async function cleanupPrompts() {
  try {
    console.log('🧹 Cleaning up existing system prompts...');

    // Delete all system-scoped prompts
    const result = await db
      .delete(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, 'system'))
      .returning();

    console.log(`✅ Deleted ${result.length} system prompts`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    await pool.end();
    process.exit(1);
  }
}

cleanupPrompts();
