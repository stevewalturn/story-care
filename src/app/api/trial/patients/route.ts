import type { NextRequest } from 'next/server';

import crypto from 'node:crypto';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { organizationsSchema, usersSchema } from '@/models/Schema';
import { createTrialPatientSchema } from '@/validations/TrialValidation';

const SAGE_HEALTH_SLUG = 'sage-health';
const DEFAULT_THERAPIST_EMAIL = 'default-therapist@sagehealth.com';

function verifyApiKey(provided: string, expected: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/trial/patients
 * Create a trial patient in the Sage Health organization.
 * Auth: X-API-Key header checked against TRIAL_API_KEY env var.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify API key
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = process.env.TRIAL_API_KEY;

    if (!expectedKey) {
      console.error('[TRIAL] TRIAL_API_KEY not configured');
      return NextResponse.json(
        { error: 'Trial API not configured' },
        { status: 500 },
      );
    }

    if (!apiKey || !verifyApiKey(apiKey, expectedKey)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // 2. Parse and validate body
    const body = await request.json();
    const parsed = createTrialPatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, firstName, lastName } = parsed.data;

    // 3. Check for existing patient by email (idempotent)
    const existingUsers = await db
      .select({ id: usersSchema.id })
      .from(usersSchema)
      .where(eq(usersSchema.email, email))
      .limit(1);

    if (existingUsers[0]) {
      return NextResponse.json(
        { storycareId: existingUsers[0].id, message: 'Patient already exists' },
        { status: 200 },
      );
    }

    // 4. Look up Sage Health organization
    const orgs = await db
      .select({ id: organizationsSchema.id })
      .from(organizationsSchema)
      .where(eq(organizationsSchema.slug, SAGE_HEALTH_SLUG))
      .limit(1);

    if (!orgs[0]) {
      console.error('[TRIAL] Sage Health organization not found. Run: npm run db:seed-sage-health');
      return NextResponse.json(
        { error: 'Trial organization not configured' },
        { status: 500 },
      );
    }

    // 5. Look up default therapist
    const therapists = await db
      .select({ id: usersSchema.id })
      .from(usersSchema)
      .where(eq(usersSchema.email, DEFAULT_THERAPIST_EMAIL))
      .limit(1);

    if (!therapists[0]) {
      console.error('[TRIAL] Default therapist not found. Run: npm run db:seed-sage-health');
      return NextResponse.json(
        { error: 'Trial therapist not configured' },
        { status: 500 },
      );
    }

    // 6. Create patient
    const newPatients = await db
      .insert(usersSchema)
      .values({
        email,
        name: `${firstName} ${lastName}`,
        role: 'patient',
        status: 'active',
        organizationId: orgs[0].id,
        therapistId: therapists[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: usersSchema.id });

    const newPatient = newPatients[0]!;

    return NextResponse.json(
      { storycareId: newPatient.id, message: 'Patient created successfully' },
      { status: 201 },
    );
  } catch (error) {
    console.error('[TRIAL] Error creating patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
