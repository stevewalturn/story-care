/**
 * Seed Feature Toggles
 * Creates default feature toggle entries in the database
 */

import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { featureTogglesSchema } from '@/models/Schema';

const toggles = [
  {
    key: 'debug_credential_logging',
    label: 'Debug: Log credentials to server console',
    description:
      'WARNING: Temporary debug toggle. When enabled, login credentials (email + password) are logged to the server console (visible in Vercel logs). Disable immediately after debugging.',
    enabled: true,
  },
];

async function seed() {
  console.log('Seeding feature toggles...');

  for (const toggle of toggles) {
    const [existing] = await db
      .select()
      .from(featureTogglesSchema)
      .where(eq(featureTogglesSchema.key, toggle.key));

    if (existing) {
      console.log(`  Toggle "${toggle.key}" already exists (enabled=${existing.enabled}), skipping.`);
    } else {
      await db.insert(featureTogglesSchema).values(toggle);
      console.log(`  Created toggle "${toggle.key}" (enabled=${toggle.enabled})`);
    }
  }

  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed feature toggles:', err);
  process.exit(1);
});
