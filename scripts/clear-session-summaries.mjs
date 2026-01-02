/**
 * Clear Session Summaries
 * Clears all cached session summaries so they regenerate with the new format
 *
 * Usage:
 *   npm run db:clear-summaries
 *   OR
 *   node --env-file=.env.local scripts/clear-session-summaries.mjs
 */

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function clearSummaries() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('\n❌ Error: DATABASE_URL environment variable is not set');
    console.error('Make sure you have a .env.local file with DATABASE_URL\n');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🗑️  Clearing session summaries...');

    const result = await pool.query(`
      UPDATE sessions
      SET session_summary = NULL,
          session_summary_generated_at = NULL,
          session_summary_model = NULL
    `);

    console.log(`\n✅ Cleared ${result.rowCount} session summaries`);
    console.log('📝 Summaries will regenerate on next AI chat request (without quotes)\n');
  } catch (error) {
    console.error('\n❌ Error clearing summaries:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearSummaries();
