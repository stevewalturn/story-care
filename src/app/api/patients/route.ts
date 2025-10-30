import type { NextRequest } from 'next/server';
import { and, eq, like } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

// GET /api/patients - List patients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const therapistFirebaseUid = searchParams.get('therapistId');

    let query = db.select().from(users);

    const conditions = [eq(users.role, 'patient')];

    if (search) {
      conditions.push(like(users.name, `%${search}%`));
    }

    // Add therapist filtering
    if (therapistFirebaseUid) {
      const [therapist] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      if (therapist) {
        conditions.push(eq(users.therapistId, therapist.id));
      } else {
        // Therapist not found, return empty array
        return NextResponse.json({ patients: [] });
      }
    }

    query = query.where(and(...conditions)) as any;

    const patientsList = await query;

    return NextResponse.json({ patients: patientsList });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 },
    );
  }
}

// POST /api/patients - Create patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      referenceImageUrl,
      therapistId: therapistFirebaseUid,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      );
    }

    // Convert Firebase UID to database UUID
    let therapistDbId = null;
    if (therapistFirebaseUid) {
      const [therapist] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      if (!therapist) {
        return NextResponse.json(
          { error: 'Therapist not found' },
          { status: 404 },
        );
      }

      therapistDbId = therapist.id;
    }

    const patientResult = await db
      .insert(users)
      .values({
        name,
        email: email || null,
        avatarUrl: referenceImageUrl || null,
        role: 'patient',
        therapistId: therapistDbId,
      })
      .returning();

    const patient = Array.isArray(patientResult) && patientResult.length > 0 ? patientResult[0] : null;

    if (!patient) {
      return NextResponse.json(
        { error: 'Failed to create patient' },
        { status: 500 },
      );
    }

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 },
    );
  }
}
