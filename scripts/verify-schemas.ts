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

async function verifySchemas() {
  console.log('🔍 Verifying JSON schemas in database...\n');

  const prompts = await db.select().from(schema.moduleAiPromptsSchema);

  const jsonPrompts = prompts.filter(p => p.outputType === 'json' || p.outputType === 'both');
  const promptsWithSchema = jsonPrompts.filter(p => p.jsonSchema);
  const promptsWithoutSchema = jsonPrompts.filter(p => !p.jsonSchema);

  console.log(`📊 Total prompts: ${prompts.length}`);
  console.log(`📊 JSON prompts: ${jsonPrompts.length}`);
  console.log(`✅ JSON prompts WITH schema: ${promptsWithSchema.length}`);
  console.log(`❌ JSON prompts WITHOUT schema: ${promptsWithoutSchema.length}\n`);

  if (promptsWithoutSchema.length > 0) {
    console.log('⚠️  Prompts missing JSON schema:');
    promptsWithoutSchema.forEach(p => console.log(`   - ${p.name}`));
    console.log();
  }

  // Show a few examples
  console.log('📄 Example schemas:\n');

  const examples = [
    'Scene Card Generation',
    'Generate Visual Metaphor',
    'Extract Key Moments',
    'Generate Check-In Questions',
  ];

  for (const name of examples) {
    const prompt = promptsWithSchema.find(p => p.name === name);
    if (prompt && prompt.jsonSchema) {
      console.log(`${prompt.name}:`);
      console.log(`  schemaType: ${(prompt.jsonSchema as any).properties?.schemaType?.enum?.[0] || 'N/A'}`);
      console.log(`  properties: ${Object.keys((prompt.jsonSchema as any).properties || {}).join(', ')}`);
      console.log();
    }
  }

  await pool.end();
  process.exit(0);
}

verifySchemas().catch((error) => {
  console.error('❌ Error verifying schemas:', error);
  process.exit(1);
});
