/**
 * Check for existing users in database
 */

import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { usersSchema } from '@/models/Schema';

async function checkUsers() {
  try {
    console.log('🔍 Checking for users in database...\n');

    // Check for super admin
    const superAdmins = await db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.role, 'super_admin'))
      .limit(5);

    console.log('Super Admins:', superAdmins.length);
    if (superAdmins.length > 0) {
      console.log('\nSuper Admin Users:');
      superAdmins.forEach((user) => {
        console.log(`  - ${user.name} (${user.email})`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Created: ${user.createdAt}`);
      });
    }

    // Check for any users
    const allUsers = await db.select().from(usersSchema).limit(10);
    console.log(`\nTotal users in database: ${allUsers.length}`);

    if (allUsers.length > 0 && superAdmins.length === 0) {
      console.log('\n⚠️  No super admin found. First user:');
      console.log(`  - ${allUsers[0].name} (${allUsers[0].email})`);
      console.log(`    ID: ${allUsers[0].id}`);
      console.log(`    Role: ${allUsers[0].role}`);
    }

    if (allUsers.length === 0) {
      console.log('\n⚠️  No users found in database.');
      console.log('You may need to create a super admin user first.');
    }
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
