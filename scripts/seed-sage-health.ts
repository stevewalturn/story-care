/**
 * Seed Sage Health Organization
 * Creates the Sage Health org, org admin (with Firebase auth), default therapist (with Firebase auth),
 * and generates a TRIAL_API_KEY if not already set.
 *
 * Usage: npm run db:seed-sage-health
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { eq } from 'drizzle-orm';
import admin from 'firebase-admin';

import { db } from '@/libs/DB';
import { organizationsSchema, usersSchema } from '@/models/Schema';

const SAGE_HEALTH_SLUG = 'sage-health';
const ORG_ADMIN_EMAIL = 'admin@sagehealth.com';
const ORG_ADMIN_PASSWORD = 'SageAdmin2026!';
const DEFAULT_THERAPIST_EMAIL = 'default-therapist@sagehealth.com';
const DEFAULT_THERAPIST_PASSWORD = 'SageTherapist2026!';

function initFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.auth();

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return admin.auth();
}

/**
 * Create or find a Firebase Auth user, return the UID.
 */
async function ensureFirebaseUser(
  adminAuth: admin.auth.Auth,
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  try {
    const existing = await adminAuth.getUserByEmail(email);
    console.log(`   Firebase user already exists: ${existing.uid}`);
    return existing.uid;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const created = await adminAuth.createUser({ email, password, displayName });
      console.log(`   Firebase user created: ${created.uid}`);
      return created.uid;
    }
    throw err;
  }
}

async function seedSageHealth() {
  console.log('🌱 Seeding Sage Health organization...\n');

  const adminAuth = initFirebaseAdmin();

  // 1. Create or find the organization
  const existingOrgs = await db
    .select()
    .from(organizationsSchema)
    .where(eq(organizationsSchema.slug, SAGE_HEALTH_SLUG))
    .limit(1);

  let org = existingOrgs[0];

  if (!org) {
    console.log('🏥 Creating Sage Health organization...');
    const newOrgs = await db
      .insert(organizationsSchema)
      .values({
        name: 'Sage Health',
        slug: SAGE_HEALTH_SLUG,
        contactEmail: ORG_ADMIN_EMAIL,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    org = newOrgs[0];
    console.log('✅ Sage Health organization created');
  } else {
    console.log('ℹ️  Sage Health organization already exists');
  }

  if (!org) {
    console.error('❌ Failed to create or find Sage Health organization');
    process.exit(1);
  }

  // 2. Create or find the org admin (with Firebase auth)
  console.log('\n👤 Org Admin...');
  const orgAdminUid = await ensureFirebaseUser(adminAuth, ORG_ADMIN_EMAIL, ORG_ADMIN_PASSWORD, 'Sage Health Admin');

  const existingAdmins = await db
    .select()
    .from(usersSchema)
    .where(eq(usersSchema.email, ORG_ADMIN_EMAIL))
    .limit(1);

  let orgAdmin = existingAdmins[0];

  if (!orgAdmin) {
    const newAdmins = await db
      .insert(usersSchema)
      .values({
        email: ORG_ADMIN_EMAIL,
        name: 'Sage Health Admin',
        role: 'org_admin',
        status: 'active',
        organizationId: org.id,
        firebaseUid: orgAdminUid,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    orgAdmin = newAdmins[0];
    console.log('   ✅ DB record created');
  } else {
    // Update firebaseUid if missing
    if (!orgAdmin.firebaseUid) {
      await db
        .update(usersSchema)
        .set({ firebaseUid: orgAdminUid, updatedAt: new Date() })
        .where(eq(usersSchema.email, ORG_ADMIN_EMAIL));
      console.log('   ✅ DB record updated with Firebase UID');
    } else {
      console.log('   ℹ️  DB record already exists');
    }
  }

  // 3. Create or find the default therapist (with Firebase auth)
  console.log('\n👨‍⚕️ Default Therapist...');
  const therapistUid = await ensureFirebaseUser(adminAuth, DEFAULT_THERAPIST_EMAIL, DEFAULT_THERAPIST_PASSWORD, 'Sage Health Default Therapist');

  const existingTherapists = await db
    .select()
    .from(usersSchema)
    .where(eq(usersSchema.email, DEFAULT_THERAPIST_EMAIL))
    .limit(1);

  let therapist = existingTherapists[0];

  if (!therapist) {
    const newTherapists = await db
      .insert(usersSchema)
      .values({
        email: DEFAULT_THERAPIST_EMAIL,
        name: 'Sage Health Default Therapist',
        role: 'therapist',
        status: 'active',
        organizationId: org.id,
        firebaseUid: therapistUid,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    therapist = newTherapists[0];
    console.log('   ✅ DB record created');
  } else {
    if (!therapist.firebaseUid) {
      await db
        .update(usersSchema)
        .set({ firebaseUid: therapistUid, updatedAt: new Date() })
        .where(eq(usersSchema.email, DEFAULT_THERAPIST_EMAIL));
      console.log('   ✅ DB record updated with Firebase UID');
    } else {
      console.log('   ℹ️  DB record already exists');
    }
  }

  // 4. Generate TRIAL_API_KEY if not set
  if (!process.env.TRIAL_API_KEY) {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const envLocalPath = path.resolve(process.cwd(), '.env.local');

    try {
      let content = '';
      if (fs.existsSync(envLocalPath)) {
        content = fs.readFileSync(envLocalPath, 'utf-8');
      }

      if (!content.includes('TRIAL_API_KEY=')) {
        const separator = content.endsWith('\n') || content === '' ? '' : '\n';
        fs.appendFileSync(envLocalPath, `${separator}\n# Trial Patient API\nTRIAL_API_KEY=${apiKey}\n`);
        console.log('\n🔑 TRIAL_API_KEY generated and appended to .env.local');
      } else {
        console.log('\nℹ️  TRIAL_API_KEY already exists in .env.local');
      }
    } catch {
      console.log('\n⚠️  Could not write to .env.local. Set TRIAL_API_KEY manually.');
    }

    console.log(`\n🔑 TRIAL_API_KEY: ${apiKey}`);
    console.log('   Share this key with the external trial admin system.\n');
  } else {
    console.log('\nℹ️  TRIAL_API_KEY already set in environment');
  }

  console.log('\n✅ Sage Health seeding complete!');
  console.log(`   Organization: ${org.name} (${org.id})`);
  console.log(`   Org Admin:    ${ORG_ADMIN_EMAIL} / ${ORG_ADMIN_PASSWORD}`);
  console.log(`   Therapist:    ${DEFAULT_THERAPIST_EMAIL} / ${DEFAULT_THERAPIST_PASSWORD}`);

  process.exit(0);
}

seedSageHealth().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
