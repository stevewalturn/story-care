/**
 * Fix Presigned URLs in Database
 *
 * This script fixes records that have presigned URLs stored instead of GCS paths.
 * It extracts the GCS path from presigned URLs and updates the database.
 *
 * IMPORTANT: Run this after deploying the code fixes to prevent new presigned URLs from being saved.
 *
 * Usage:
 *   npx tsx scripts/fix-presigned-urls.ts
 */

import { eq, isNotNull, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { extractGcsPath } from '@/libs/GCS';
import { mediaLibrary, sessions, users } from '@/models/Schema';
import 'dotenv/config';

type FixStats = {
  table: string;
  field: string;
  total: number;
  fixed: number;
  skipped: number;
  errors: number;
};

/**
 * Extract GCS path from presigned URL or return original if already a path
 */
function cleanUrl(url: string | null): string | null {
  if (!url) return null;

  // If URL contains signature parameters, it's a presigned URL
  if (url.includes('GoogleAccessId') || url.includes('X-Goog-Signature')) {
    const path = extractGcsPath(url);
    if (path) {
      console.log(`  Extracted: ${url.substring(0, 80)}... → ${path}`);
      return path;
    }
    console.warn(`  ⚠️  Could not extract path from: ${url.substring(0, 80)}...`);
    return url; // Keep original if extraction fails
  }

  // Already a path or doesn't need fixing
  return url;
}

/**
 * Fix media_library table
 */
async function fixMediaLibrary(): Promise<FixStats> {
  console.log('\n📦 Fixing media_library table...');

  const stats: FixStats = {
    table: 'media_library',
    field: 'mediaUrl, thumbnailUrl',
    total: 0,
    fixed: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Fetch all media records with URLs
    const media = await db
      .select({
        id: mediaLibrary.id,
        mediaUrl: mediaLibrary.mediaUrl,
        thumbnailUrl: mediaLibrary.thumbnailUrl,
      })
      .from(mediaLibrary)
      .where(isNotNull(mediaLibrary.mediaUrl));

    stats.total = media.length;
    console.log(`  Found ${stats.total} media records`);

    for (const item of media) {
      try {
        const cleanedMediaUrl = cleanUrl(item.mediaUrl);
        const cleanedThumbnailUrl = cleanUrl(item.thumbnailUrl);

        // Only update if something changed
        if (cleanedMediaUrl !== item.mediaUrl || cleanedThumbnailUrl !== item.thumbnailUrl) {
          await db
            .update(mediaLibrary)
            .set({
              mediaUrl: cleanedMediaUrl,
              thumbnailUrl: cleanedThumbnailUrl,
              updatedAt: new Date(),
            })
            .where(eq(mediaLibrary.id, item.id));

          stats.fixed++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        console.error(`  ❌ Error fixing media ${item.id}:`, error);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('  ❌ Error querying media_library:', error);
    throw error;
  }

  return stats;
}

/**
 * Fix users table (avatarUrl, referenceImageUrl)
 */
async function fixUsers(): Promise<FixStats> {
  console.log('\n👤 Fixing users table...');

  const stats: FixStats = {
    table: 'users',
    field: 'avatarUrl, referenceImageUrl',
    total: 0,
    fixed: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Fetch all users with image URLs
    const usersList = await db
      .select({
        id: users.id,
        avatarUrl: users.avatarUrl,
        referenceImageUrl: users.referenceImageUrl,
      })
      .from(users)
      .where(
        or(
          isNotNull(users.avatarUrl),
          isNotNull(users.referenceImageUrl),
        ),
      );

    stats.total = usersList.length;
    console.log(`  Found ${stats.total} users with images`);

    for (const user of usersList) {
      try {
        const cleanedAvatarUrl = cleanUrl(user.avatarUrl);
        const cleanedReferenceImageUrl = cleanUrl(user.referenceImageUrl);

        // Only update if something changed
        if (cleanedAvatarUrl !== user.avatarUrl || cleanedReferenceImageUrl !== user.referenceImageUrl) {
          await db
            .update(users)
            .set({
              avatarUrl: cleanedAvatarUrl,
              referenceImageUrl: cleanedReferenceImageUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          stats.fixed++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        console.error(`  ❌ Error fixing user ${user.id}:`, error);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('  ❌ Error querying users:', error);
    throw error;
  }

  return stats;
}

/**
 * Fix sessions table (audioUrl)
 */
async function fixSessions(): Promise<FixStats> {
  console.log('\n🎙️  Fixing sessions table...');

  const stats: FixStats = {
    table: 'sessions',
    field: 'audioUrl',
    total: 0,
    fixed: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Fetch all sessions with audio URLs
    const sessionsList = await db
      .select({
        id: sessions.id,
        audioUrl: sessions.audioUrl,
      })
      .from(sessions)
      .where(isNotNull(sessions.audioUrl));

    stats.total = sessionsList.length;
    console.log(`  Found ${stats.total} sessions with audio`);

    for (const session of sessionsList) {
      try {
        const cleanedAudioUrl = cleanUrl(session.audioUrl);

        // Only update if something changed and cleanedAudioUrl is not null
        if (cleanedAudioUrl !== null && cleanedAudioUrl !== session.audioUrl) {
          await db
            .update(sessions)
            .set({
              audioUrl: cleanedAudioUrl,
              updatedAt: new Date(),
            })
            .where(eq(sessions.id, session.id));

          stats.fixed++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        console.error(`  ❌ Error fixing session ${session.id}:`, error);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('  ❌ Error querying sessions:', error);
    throw error;
  }

  return stats;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Starting presigned URL cleanup...\n');
  console.log('This script will:');
  console.log('  1. Find all presigned URLs in the database');
  console.log('  2. Extract GCS paths from them');
  console.log('  3. Update records with clean paths\n');

  const allStats: FixStats[] = [];

  try {
    // Fix each table
    allStats.push(await fixMediaLibrary());
    allStats.push(await fixUsers());
    allStats.push(await fixSessions());

    // Print summary
    console.log('\n\n✨ Cleanup Summary:');
    console.log('═══════════════════════════════════════════════════════');

    let totalRecords = 0;
    let totalFixed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const stat of allStats) {
      console.log(`\n📊 ${stat.table} (${stat.field})`);
      console.log(`  Total records:    ${stat.total}`);
      console.log(`  ✅ Fixed:         ${stat.fixed}`);
      console.log(`  ⏭️  Skipped:       ${stat.skipped}`);
      console.log(`  ❌ Errors:        ${stat.errors}`);

      totalRecords += stat.total;
      totalFixed += stat.fixed;
      totalSkipped += stat.skipped;
      totalErrors += stat.errors;
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📈 Overall Totals:');
    console.log(`  Total records:    ${totalRecords}`);
    console.log(`  ✅ Fixed:         ${totalFixed}`);
    console.log(`  ⏭️  Skipped:       ${totalSkipped}`);
    console.log(`  ❌ Errors:        ${totalErrors}`);
    console.log('═══════════════════════════════════════════════════════');

    if (totalErrors > 0) {
      console.log('\n⚠️  Some errors occurred. Review logs above.');
      process.exit(1);
    }

    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error during cleanup:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as fixPresignedUrls };
