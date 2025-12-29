/**
 * Fix Patient Organization IDs
 * Updates patients to inherit organizationId from their assigned therapist
 */

import path from 'node:path';
// Load environment variables
import dotenv from 'dotenv';

import { eq } from 'drizzle-orm';
import { db } from '../src/libs/DB';
import { users } from '../src/models/Schema';

// Load .env.local first (takes precedence), then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function fixPatientOrganizations() {
  console.log('Starting patient organization fix...\n');

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

  console.log('\nAll users:');
  allUsers.forEach((user) => {
    console.log(`- ${user.name} (${user.role}): orgId=${user.organizationId || 'NULL'}, therapistId=${user.therapistId || 'NULL'}`);
  });

  // 2. Find patients without organizationId or with mismatched organizationId
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
}

// Run the fix
fixPatientOrganizations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
