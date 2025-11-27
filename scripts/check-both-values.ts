// Load environment variables FIRST
import * as dotenv from 'dotenv';

import { eq } from 'drizzle-orm';
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

async function checkAndFixBothValues() {
  console.log('🔍 Checking for prompts with outputType = "both"...\n');

  // Get all prompts
  const prompts = await db.select().from(schema.moduleAiPromptsSchema);

  // Filter prompts with "both" output type
  const bothPrompts = prompts.filter(p => p.outputType === 'both');

  if (bothPrompts.length === 0) {
    console.log('✅ No prompts found with outputType = "both"');
    await pool.end();
    process.exit(0);
  }

  console.log(`Found ${bothPrompts.length} prompts with outputType = "both":\n`);

  for (const prompt of bothPrompts) {
    console.log(`  - ${prompt.name} (ID: ${prompt.id})`);
  }

  console.log('\n🔧 Converting all "both" values to "json"...\n');

  // Update all "both" to "json"
  for (const prompt of bothPrompts) {
    await db
      .update(schema.moduleAiPromptsSchema)
      .set({ outputType: 'json' })
      .where(eq(schema.moduleAiPromptsSchema.id, prompt.id));

    console.log(`  ✅ Updated: ${prompt.name}`);
  }

  console.log(`\n✨ Done! Converted ${bothPrompts.length} prompts from "both" to "json"`);

  await pool.end();
  process.exit(0);
}

checkAndFixBothValues().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
