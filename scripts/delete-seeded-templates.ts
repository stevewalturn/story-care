/**
 * Delete Seeded Templates
 * Removes all system-level templates to allow re-seeding with corrected data
 */

import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  reflectionTemplatesSchema,
  surveyTemplatesSchema,
} from '../src/models/Schema';
import * as schema from '../src/models/Schema';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function deleteTemplates() {
  try {
    console.log('🗑️  Deleting system templates...\n');

    // Delete reflection templates with scope='system'
    const deletedReflection = await db
      .delete(reflectionTemplatesSchema)
      .where(eq(reflectionTemplatesSchema.scope, 'system'))
      .returning();

    console.log(`✅ Deleted ${deletedReflection.length} reflection templates`);

    // Delete survey templates with scope='system'
    const deletedSurvey = await db
      .delete(surveyTemplatesSchema)
      .where(eq(surveyTemplatesSchema.scope, 'system'))
      .returning();

    console.log(`✅ Deleted ${deletedSurvey.length} survey templates`);

    console.log(`\n✨ Total deleted: ${deletedReflection.length + deletedSurvey.length} templates\n`);

    await pool.end();
    process.exit(0);
  }
  catch (error) {
    console.error('\n❌ Deletion failed:', error);
    await pool.end();
    process.exit(1);
  }
}

deleteTemplates();
