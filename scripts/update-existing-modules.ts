/**
 * Update Existing Modules to Use Templates
 * DEPRECATED: This script is no longer needed with the new array-based template schema
 */

import 'dotenv/config';

export async function updateExistingModules() {
  console.log('🔄 Updating existing modules to use templates...\n');

  try {
    // This script is deprecated - the schema has changed to use template ID arrays
    // instead of single template IDs with boolean flags
    console.log('⚠️  This script is deprecated.');
    console.log('    The schema now uses reflectionTemplateIds[] and surveyTemplateIds[] arrays');
    console.log('    instead of reflectionTemplateId/useReflectionTemplate flags.');
    console.log('    Please use seed-modules.ts to create new modules with the correct schema.');

    console.log('\n✨ Update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating modules:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateExistingModules()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}
