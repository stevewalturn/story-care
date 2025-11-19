/**
 * Cleanup Script: Delete All Modules and Templates
 * Prepares database for fresh seeding with proper template links
 */

import { db } from '@/libs/DB';
import { reflectionTemplatesSchema, surveyTemplatesSchema, treatmentModulesSchema } from '@/models/Schema';
import 'dotenv/config';

async function cleanupModulesAndTemplates() {
  console.log('🧹 Cleaning up modules and templates...\n');

  try {
    // Delete all treatment modules
    console.log('🗑️  Deleting all treatment modules...');
    const deletedModules = await db.delete(treatmentModulesSchema).returning();
    console.log(`   ✅ Deleted ${deletedModules.length} modules`);

    // Delete all reflection templates
    console.log('🗑️  Deleting all reflection templates...');
    const deletedReflection = await db.delete(reflectionTemplatesSchema).returning();
    console.log(`   ✅ Deleted ${deletedReflection.length} reflection templates`);

    // Delete all survey templates
    console.log('🗑️  Deleting all survey templates...');
    const deletedSurvey = await db.delete(surveyTemplatesSchema).returning();
    console.log(`   ✅ Deleted ${deletedSurvey.length} survey templates`);

    console.log('\n✨ Cleanup complete! Database is ready for fresh seeding.');
    console.log('   Run: npm run db:seed-modules');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  cleanupModulesAndTemplates()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}
