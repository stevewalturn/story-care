/**
 * Seed Super Admin User
 * Creates a super admin account for initial platform setup
 *
 * Usage:
 *   npm run db:seed-superadmin
 */

import path from 'node:path';
// Load environment variables from .env.local
import dotenv from 'dotenv';

import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedSuperAdmin() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@storycare.com';
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const firebaseUid = process.env.SUPER_ADMIN_FIREBASE_UID || '';

  if (!firebaseUid) {
    console.error('\n❌ Error: SUPER_ADMIN_FIREBASE_UID is required');
    console.log('\nSteps to create a super admin:');
    console.log('1. Create a Firebase user account (via Firebase Console or sign-up page)');
    console.log('2. Get the Firebase UID from Firebase Console > Authentication > Users');
    console.log('3. Run this script with the UID:');
    console.log('   SUPER_ADMIN_FIREBASE_UID=your-firebase-uid tsx scripts/seed-superadmin.ts\n');
    process.exit(1);
  }

  try {
    console.log('\n🌱 Seeding super admin user...\n');

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.firebaseUid, firebaseUid),
    });

    if (existingUser) {
      console.log('⚠️  User already exists in database');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Status: ${existingUser.status}\n`);

      if (existingUser.role === 'super_admin') {
        console.log('✅ User is already a super admin\n');
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

      if (!Array.isArray(updatedUsers) || updatedUsers.length === 0) {
        throw new Error('Failed to update user');
      }

      const updatedUser = updatedUsers[0]!;

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

      if (!Array.isArray(newUsers) || newUsers.length === 0) {
        throw new Error('Failed to create super admin user');
      }

      const newUser = newUsers[0];

      console.log('✅ Super admin user created successfully!');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Status: ${newUser.status}`);
      console.log(`   Firebase UID: ${newUser.firebaseUid}\n`);
    }

    console.log('🎉 Done! You can now sign in with this account.\n');
  } catch (error) {
    console.error('\n❌ Error seeding super admin:', error);
    process.exit(1);
  }
}

// Run the seed function
seedSuperAdmin();
