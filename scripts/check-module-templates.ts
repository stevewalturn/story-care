/**
 * Diagnostic Script: Check Module Template Links
 * Verifies that modules have template IDs properly linked
 */

import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { reflectionTemplatesSchema, surveyTemplatesSchema, treatmentModulesSchema } from '@/models/Schema';
import 'dotenv/config';

async function checkModuleTemplates() {
  console.log('🔍 Checking module template links...\n');

  try {
    // Get all modules
    const modules = await db
      .select()
      .from(treatmentModulesSchema)
      .where(eq(treatmentModulesSchema.scope, 'system'));

    console.log(`Found ${modules.length} system modules\n`);

    for (const treatmentModule of modules) {
      console.log(`📦 Module: ${treatmentModule.name}`);
      console.log(`   ID: ${treatmentModule.id}`);
      console.log(`   Reflection Template IDs: ${JSON.stringify(treatmentModule.reflectionTemplateIds)}`);
      console.log(`   Survey Template IDs: ${JSON.stringify(treatmentModule.surveyTemplateIds)}`);

      // Check if templates actually exist
      if (treatmentModule.reflectionTemplateIds && treatmentModule.reflectionTemplateIds.length > 0) {
        for (const templateId of treatmentModule.reflectionTemplateIds) {
          const template = await db.query.reflectionTemplatesSchema.findFirst({
            where: eq(reflectionTemplatesSchema.id, templateId),
          });
          if (template) {
            console.log(`   ✅ Reflection template found: "${template.title}"`);
          } else {
            console.log(`   ❌ Reflection template NOT FOUND: ${templateId}`);
          }
        }
      } else {
        console.log(`   ⚠️  No reflection template IDs linked`);
      }

      if (treatmentModule.surveyTemplateIds && treatmentModule.surveyTemplateIds.length > 0) {
        for (const templateId of treatmentModule.surveyTemplateIds) {
          const template = await db.query.surveyTemplatesSchema.findFirst({
            where: eq(surveyTemplatesSchema.id, templateId),
          });
          if (template) {
            console.log(`   ✅ Survey template found: "${template.title}"`);
          } else {
            console.log(`   ❌ Survey template NOT FOUND: ${templateId}`);
          }
        }
      } else {
        console.log(`   ⚠️  No survey template IDs linked`);
      }

      console.log('');
    }

    // Count all templates
    const reflectionTemplates = await db.select().from(reflectionTemplatesSchema);
    const surveyTemplates = await db.select().from(surveyTemplatesSchema);

    console.log('\n📊 Template Summary:');
    console.log(`   Total Reflection Templates: ${reflectionTemplates.length}`);
    console.log(`   Total Survey Templates: ${surveyTemplates.length}`);

    console.log('\n✅ Diagnostic complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  checkModuleTemplates()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}
