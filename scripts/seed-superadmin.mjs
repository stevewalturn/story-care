/**
 * Seed Super Admin User
 * Creates a super admin account for initial platform setup
 *
 * Usage:
 *   npm run db:seed-superadmin
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import pg from 'pg';

const { Pool } = pg;

// Define minimal schema needed for this script
const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'org_admin',
  'therapist',
  'patient',
]);

const userStatusEnum = pgEnum('user_status', [
  'pending_approval',
  'active',
  'inactive',
]);

const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: varchar('firebase_uid', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  status: userStatusEnum('status').notNull().default('pending_approval'),
  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

async function seedSuperAdmin() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@storycare.com';
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const firebaseUid = process.env.SUPER_ADMIN_FIREBASE_UID || '';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('\n❌ Error: DATABASE_URL environment variable is not set');
    console.log('Make sure you have a .env.local file with DATABASE_URL\n');
    process.exit(1);
  }

  if (!firebaseUid) {
    console.error('\n❌ Error: SUPER_ADMIN_FIREBASE_UID is required');
    console.log('\nSteps to create a super admin:');
    console.log('1. Create a Firebase user account (via Firebase Console or sign-up page)');
    console.log('2. Get the Firebase UID from Firebase Console > Authentication > Users');
    console.log('3. Run this script with the UID:');
    console.log('   SUPER_ADMIN_FIREBASE_UID=your-firebase-uid npm run db:seed-superadmin\n');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  const db = drizzle(pool);

  try {
    console.log('\n🌱 Seeding super admin user...\n');

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    const existingUser = existingUsers[0];

    if (existingUser) {
      console.log('⚠️  User already exists in database');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Status: ${existingUser.status}\n`);

      if (existingUser.role === 'super_admin') {
        console.log('✅ User is already a super admin\n');
        await pool.end();
        process.exit(0);
      }

      // Update existing user to super admin
      const updatedUsers = await db
        .update(users)
        .set({
          role: 'super_admin',
          status: 'active',
          organizationId: null, // Super admins are not tied to an organization
          updatedAt: new Date(),
        })
        .where(eq(users.firebaseUid, firebaseUid))
        .returning();

      const updatedUser = updatedUsers[0];

      console.log('✅ Updated existing user to super admin');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Name: ${updatedUser.name}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Status: ${updatedUser.status}\n`);
    } else {
      // Create new super admin user
      const newUsers = await db
        .insert(users)
        .values({
          firebaseUid,
          email: superAdminEmail,
          name: superAdminName,
          role: 'super_admin',
          status: 'active',
          organizationId: null, // Super admins are not tied to an organization
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const newUser = newUsers[0];

      console.log('✅ Super admin user created successfully!');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Status: ${newUser.status}`);
      console.log(`   Firebase UID: ${newUser.firebaseUid}\n`);
    }

    console.log('🎉 Done! You can now sign in with this account.\n');
    await pool.end();
  } catch (error) {
    console.error('\n❌ Error seeding super admin:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the seed function
seedSuperAdmin();
