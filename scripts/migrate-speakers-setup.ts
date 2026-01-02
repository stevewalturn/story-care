/**
 * Migration Script: Set speakersSetupCompleted = true for sessions with summaries
 *
 * Run with: npx tsx scripts/migrate-speakers-setup.ts
 */

import path from 'node:path';
// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';

import { isNotNull, sql } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { sessions } from '@/models/Schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateSessionsWithSummaries() {
  console.log('Starting migration: Setting speakersSetupCompleted for sessions with summaries...');

  try {
    // First, count how many sessions will be affected
    const sessionsWithSummary = await db
      .select({ id: sessions.id, title: sessions.title })
      .from(sessions)
      .where(isNotNull(sessions.sessionSummary));

    console.log(`Found ${sessionsWithSummary.length} sessions with summaries to migrate.`);

    if (sessionsWithSummary.length === 0) {
      console.log('No sessions to migrate.');
      return;
    }

    // Update all sessions that have a summary
    await db
      .update(sessions)
      .set({ speakersSetupCompleted: true })
      .where(isNotNull(sessions.sessionSummary));

    console.log('Migration completed successfully!');
    console.log(`Updated sessions:`);
    sessionsWithSummary.forEach(s => console.log(`  - ${s.title} (${s.id})`));

    // Verify the update
    const updatedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(sql`${sessions.speakersSetupCompleted} = true`);

    console.log(`\nVerification: ${updatedCount[0]?.count || 0} sessions now have speakersSetupCompleted = true`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSessionsWithSummaries()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
