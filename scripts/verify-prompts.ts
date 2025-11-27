/**
 * Verification Script: Check seeded system prompts
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

async function verifyPrompts() {
  try {
    console.log('🔍 Verifying system prompts...\n');

    const prompts = await db
      .select({
        name: moduleAiPromptsSchema.name,
        outputType: moduleAiPromptsSchema.outputType,
        category: moduleAiPromptsSchema.category,
        scope: moduleAiPromptsSchema.scope,
      })
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, 'system'))
      .limit(10);

    console.log('First 10 system prompts:');
    console.log('━'.repeat(80));
    prompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.name}`);
      console.log(`   Category: ${prompt.category} | Output Type: ${prompt.outputType}`);
    });
    console.log('━'.repeat(80));

    const totalCount = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, 'system'));

    console.log(`\n✅ Total system prompts: ${totalCount.length}`);

    // Check if all have JSON output type
    const jsonCount = totalCount.filter(p => p.outputType === 'json').length;
    console.log(`✅ Prompts with JSON output: ${jsonCount}/${totalCount.length}`);

    if (jsonCount === totalCount.length) {
      console.log('\n🎉 All system prompts successfully configured with JSON output!');
    } else {
      console.log(`\n⚠️  Warning: ${totalCount.length - jsonCount} prompts not configured for JSON output`);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await pool.end();
    process.exit(1);
  }
}

verifyPrompts();
