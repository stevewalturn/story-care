/**
 * Update Existing Modules to Use Templates
 * Sets useReflectionTemplate and useSurveyTemplate flags for existing modules
 */

import { db } from '@/libs/DB';
import { treatmentModulesSchema } from '@/models/Schema';
import { isNotNull } from 'drizzle-orm';
import 'dotenv/config';

export async function updateExistingModules() {
  console.log('🔄 Updating existing modules to use templates...\n');

  try {
    // Update modules that have reflectionTemplateId to use reflection templates
    const reflectionUpdate = await db
      .update(treatmentModulesSchema)
      .set({ useReflectionTemplate: true })
      .where(isNotNull(treatmentModulesSchema.reflectionTemplateId))
      .returning();

    console.log(`✅ Updated ${reflectionUpdate.length} modules to use reflection templates`);

    // Update modules that have surveyTemplateId to use survey templates
    const surveyUpdate = await db
      .update(treatmentModulesSchema)
      .set({ useSurveyTemplate: true })
      .where(isNotNull(treatmentModulesSchema.surveyTemplateId))
      .returning();

    console.log(`✅ Updated ${surveyUpdate.length} modules to use survey templates`);

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
