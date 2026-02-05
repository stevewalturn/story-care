/**
 * Create Super Admin User
 * Creates BOTH Firebase Auth user AND database record
 *
 * Usage:
 *   node scripts/create-superadmin.mjs <email> <password> <name>
 *
 * Example:
 *   node scripts/create-superadmin.mjs noah.hendler@entryway.health securepassword "Noah Hendler"
 */

import admin from 'firebase-admin';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Schema definitions (minimal for script)
const userRoleEnum = pgEnum('user_role', ['super_admin', 'org_admin', 'therapist', 'patient']);
const userStatusEnum = pgEnum('user_status', ['invited', 'active', 'inactive', 'deleted']);

const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: varchar('firebase_uid', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  status: userStatusEnum('status').notNull().default('active'),
  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Initialize Firebase Admin
function initFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.auth();

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return admin.auth();
}

async function createSuperAdmin(email, password, name) {
  // Validate inputs
  if (!email || !password || !name) {
    console.error('\n❌ Usage: node scripts/create-superadmin.mjs <email> <password> <name>');
    console.log('Example: node scripts/create-superadmin.mjs user@example.com password123 "John Doe"\n');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL environment variable is not set\n');
    process.exit(1);
  }

  const adminAuth = initFirebaseAdmin();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  let firebaseUser = null;

  try {
    console.log('\n🚀 Creating super admin user...\n');

    // Step 1: Check if Firebase user exists
    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
      console.log(`📧 Firebase user already exists: ${firebaseUser.uid}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Create Firebase user
        firebaseUser = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        });
        console.log(`✅ Created Firebase user: ${firebaseUser.uid}`);
      } else {
        throw err;
      }
    }

    // Step 2: Check if database user exists
    const existingUsers = await db.select().from(users).where(eq(users.firebaseUid, firebaseUser.uid)).limit(1);

    if (existingUsers[0]) {
      // Update to super admin
      const [updated] = await db.update(users)
        .set({ role: 'super_admin', status: 'active', organizationId: null, updatedAt: new Date() })
        .where(eq(users.firebaseUid, firebaseUser.uid))
        .returning();
      console.log(`✅ Updated existing user to super admin`);
      console.log(`   Database ID: ${updated.id}`);
    } else {
      // Create database user
      const [created] = await db.insert(users).values({
        firebaseUid: firebaseUser.uid,
        email,
        name,
        role: 'super_admin',
        status: 'active',
        organizationId: null,
      }).returning();
      console.log(`✅ Created database user`);
      console.log(`   Database ID: ${created.id}`);
    }

    console.log(`\n🎉 Super admin created successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Firebase UID: ${firebaseUser.uid}`);
    console.log(`\n👉 Sign in at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in\n`);

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run with CLI args
const [,, email, password, name] = process.argv;
createSuperAdmin(email, password, name);
