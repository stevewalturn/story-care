/**
 * Fix Patient Organization IDs
 * Updates patients to inherit organizationId from their assigned therapist
 */

import * as path from 'node:path';
// Load environment variables first
import * as dotenv from 'dotenv';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/models/Schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { users } = schema;

async function fixPatientOrganizations() {
  console.log('Starting patient organization fix...\n');

  // Initialize database connection
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log(`Connecting to PostgreSQL database...\n`);

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  const db = drizzle(pool, { schema });

  try {
    // 1. First, let's see what we have
    console.log('=== Current Database State ===');

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        organizationId: users.organizationId,
        therapistId: users.therapistId,
        firebaseUid: users.firebaseUid,
      })
      .from(users);

    console.log(`\nTotal users: ${allUsers.length}`);
    allUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.role}): orgId=${user.organizationId || 'NULL'}, therapistId=${user.therapistId || 'NULL'}`);
    });

    // 2. Find patients
    const patientsNeedingFix = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        therapistId: users.therapistId,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(eq(users.role, 'patient'));

    console.log(`\n=== Found ${patientsNeedingFix.length} patient(s) ===`);

    // 3. Update each patient's organizationId based on their therapist
    let fixedCount = 0;

    for (const patient of patientsNeedingFix) {
      if (!patient.therapistId) {
        console.log(`⚠️  Patient "${patient.name}" has no therapist assigned, skipping...`);
        continue;
      }

      // Get the therapist
      const [therapist] = await db
        .select({
          id: users.id,
          name: users.name,
          organizationId: users.organizationId,
        })
        .from(users)
        .where(eq(users.id, patient.therapistId))
        .limit(1);

      if (!therapist) {
        console.log(`⚠️  Therapist not found for patient "${patient.name}", skipping...`);
        continue;
      }

      if (!therapist.organizationId) {
        console.log(`⚠️  Therapist "${therapist.name}" has no organization, skipping patient "${patient.name}"...`);
        continue;
      }

      // Check if update is needed
      if (patient.organizationId === therapist.organizationId) {
        console.log(`✓ Patient "${patient.name}" already has correct organizationId`);
        continue;
      }

      // Update the patient's organizationId
      console.log(`→ Updating patient "${patient.name}" organizationId from ${patient.organizationId || 'NULL'} to ${therapist.organizationId}`);

      await db
        .update(users)
        .set({ organizationId: therapist.organizationId })
        .where(eq(users.id, patient.id));

      fixedCount++;
      console.log(`✓ Updated patient "${patient.name}"`);
    }

    console.log(`\n=== Summary ===`);
    console.log(`Fixed ${fixedCount} patient record(s)`);
    console.log('Done!\n');
  } finally {
    await pool.end();
  }
}

// Run the fix
fixPatientOrganizations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
