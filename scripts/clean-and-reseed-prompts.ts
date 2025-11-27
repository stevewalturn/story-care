#!/usr/bin/env tsx

/**
 * Clean and Reseed System Prompts
 *
 * This script:
 * 1. Deletes all existing system-level therapeutic prompts
 * 2. Reseeds the database with updated prompts from seed-system-prompts.ts
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { moduleAiPromptsSchema } from '../src/models/Schema';
import * as schema from '../src/models/Schema';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Create database connection directly (same as seed script)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function cleanAndReseed() {
  console.log('🧹 Starting cleanup and reseed process...\n');

  try {
    // Step 1: Delete all system-level prompts
    console.log('📋 Deleting existing system-level AI prompts...');

    const deleteResult = await db
      .delete(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, 'system'))
      .returning();

    console.log(`✅ Deleted ${deleteResult.length} system prompts\n`);

    // Step 2: Run the seed script directly
    console.log('🌱 Reseeding database with updated prompts...');
    console.log('   (This will skip existing prompts and add new ones)\n');

    // Close our connection and let the seed script manage its own
    await pool.end();

    // Import and run the seed script - it will handle its own connection
    await import('./seed-system-prompts');

    // The seed script will exit the process, so this won't execute
  } catch (error) {
    console.error('❌ Error during clean and reseed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the script
cleanAndReseed();
