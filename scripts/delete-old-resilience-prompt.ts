import * as dotenv from 'dotenv';
import { and, eq } from 'drizzle-orm';
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

async function deleteOldPrompt() {
  try {
    console.log('🗑️  Deleting "Self-Resilience & Re-Authoring Analysis"...\n');

    const result = await db
      .delete(moduleAiPromptsSchema)
      .where(
        and(
          eq(moduleAiPromptsSchema.name, 'Self-Resilience & Re-Authoring Analysis'),
          eq(moduleAiPromptsSchema.scope, 'system'),
        ),
      )
      .returning();

    if (result.length > 0) {
      console.log(`✅ Deleted ${result.length} prompt successfully!`);
    } else {
      console.log('⚠️  Prompt not found or already deleted');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

deleteOldPrompt();
