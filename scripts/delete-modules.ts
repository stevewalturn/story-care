/**
 * Delete all treatment modules
 * Use this to clean database before re-seeding
 */

import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { treatmentModulesSchema } from '@/models/Schema';

async function deleteModules() {
  console.log('🗑️  Deleting all treatment modules...');

  const deleted = await db
    .delete(treatmentModulesSchema)
    .where(eq(treatmentModulesSchema.scope, 'system'))
    .returning();

  console.log(`✅ Deleted ${deleted.length} modules`);
  process.exit(0);
}

deleteModules().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
