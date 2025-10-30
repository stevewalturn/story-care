import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// GET /api/patients/[id] - Get a single patient
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, referenceImageUrl, avatarUrl } = body;

    // Build update object with only provided fields that exist in schema
    // Note: phone and notes fields don't exist in the users table
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (referenceImageUrl !== undefined) updateData.referenceImageUrl = referenceImageUrl;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    updateData.updatedAt = new Date();

    const [updatedPatient] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ patient: updatedPatient });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete patient
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deletedPatient = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedPatient || !Array.isArray(deletedPatient) || deletedPatient.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
