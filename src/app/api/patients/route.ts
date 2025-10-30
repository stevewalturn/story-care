import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { eq, like } from 'drizzle-orm';

// GET /api/patients - List patients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const therapistId = searchParams.get('therapistId');

    let query = db
      .select()
      .from(users)
      .where(eq(users.role, 'patient'));

    if (search) {
      query = query.where(like(users.name, `%${search}%`)) as any;
    }

    const patientsList = await query;

    return NextResponse.json({ patients: patientsList });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, referenceImageUrl, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const [patient] = await db
      .insert(users)
      .values({
        name,
        email: email || null,
        phone: phone || null,
        avatarUrl: referenceImageUrl || null,
        role: 'patient',
      })
      .returning();

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
