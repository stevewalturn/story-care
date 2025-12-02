/**
 * Delete all system prompts to allow re-seeding
 */

import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { moduleAiPromptsSchema, usersSchema } from '../src/models/Schema';
import * as schema from '../src/models/Schema';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function deleteSystemPrompts() {
  try {
    console.log('🗑️  Deleting system prompts...');

    // Find system user
    const [systemUser] = await db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.email, 'system@storycare.app'))
      .limit(1);

    if (!systemUser) {
      console.log('❌ System user not found');
      process.exit(1);
    }

    console.log(`Found system user: ${systemUser.email} (${systemUser.id})`);

    // Delete all prompts created by system user
    const result = await db
      .delete(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.createdBy, systemUser.id));

    console.log(`✅ Deleted system prompts`);
    console.log('✨ You can now re-run the seed script');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteSystemPrompts();
