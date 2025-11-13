/**
 * Get or create system user for seeding
 */

import { eq } from 'drizzle-orm';
import { db } from '../src/libs/DB.js';
import { usersSchema } from '../src/models/Schema.js';
import 'dotenv/config';

async function getSystemUser() {
  try {
    console.log('🔍 Looking for super admin user...\n');

    // Check for super admin
    const superAdmins = await db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.role, 'super_admin'))
      .limit(1);

    if (superAdmins.length > 0) {
      const user = superAdmins[0];
      if (user) {
        console.log('✅ Found super admin:');
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user.id}\n`);
        console.log(`Update seed-modules.ts with:`);
        console.log(`const SYSTEM_USER_ID = '${user.id}';`);
      }
      return;
    }

    // Check for any users
    const anyUsers = await db.select().from(usersSchema).limit(1);

    if (anyUsers.length > 0) {
      const user = anyUsers[0];
      if (user) {
        console.log('⚠️  No super admin found. First user:');
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}\n`);
        console.log(`You can use this user ID or create a super admin first.`);
        console.log(`\nUpdate seed-modules.ts with:`);
        console.log(`const SYSTEM_USER_ID = '${user.id}';`);
      }
      return;
    }

    console.log('❌ No users found in database.');
    console.log('\nYou need to create a user first. Run this in your app or use SQL:\n');
    console.log(`INSERT INTO users (name, email, role, firebase_uid, created_at, updated_at)`);
    console.log(`VALUES ('System Admin', 'admin@storycare.com', 'super_admin', NULL, NOW(), NOW())`);
    console.log(`RETURNING id;`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getSystemUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
