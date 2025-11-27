import { eq } from 'drizzle-orm';
import { db } from '../src/libs/DB';
import {
  moduleAiPromptsSchema,
  modulePromptLinksSchema,
  treatmentModulesSchema,
} from '../src/models/Schema';

async function checkModuleLinks() {
  try {
    // Get all treatment modules
    const modules = await db
      .select({
        id: treatmentModulesSchema.id,
        name: treatmentModulesSchema.name,
      })
      .from(treatmentModulesSchema);

    console.log(`\nFound ${modules.length} treatment modules:\n`);

    for (const module of modules) {
      // Get linked prompts for this module
      const linkedPrompts = await db
        .select({
          promptId: modulePromptLinksSchema.promptId,
          promptName: moduleAiPromptsSchema.name,
          promptCategory: moduleAiPromptsSchema.category,
          sortOrder: modulePromptLinksSchema.sortOrder,
        })
        .from(modulePromptLinksSchema)
        .innerJoin(
          moduleAiPromptsSchema,
          eq(modulePromptLinksSchema.promptId, moduleAiPromptsSchema.id),
        )
        .where(eq(modulePromptLinksSchema.moduleId, module.id))
        .orderBy(modulePromptLinksSchema.sortOrder);

      console.log(`Module: ${module.name}`);
      console.log(`  Linked prompts: ${linkedPrompts.length}`);
      if (linkedPrompts.length > 0) {
        linkedPrompts.forEach((p) => {
          console.log(`    - [${p.promptCategory}] ${p.promptName}`);
        });
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkModuleLinks();
