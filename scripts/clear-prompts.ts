// Load environment variables FIRST
import * as dotenv from 'dotenv';

// Import drizzle and pg directly to bypass Env validation
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/models/Schema';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Create database connection directly
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function clearPrompts() {
  console.log('🗑️  Clearing all prompt templates...');

  await db.delete(schema.moduleAiPromptsSchema);

  console.log('✅ All prompts cleared!');
  await pool.end();
  process.exit(0);
}

clearPrompts().catch((error) => {
  console.error('❌ Error clearing prompts:', error);
  process.exit(1);
});
