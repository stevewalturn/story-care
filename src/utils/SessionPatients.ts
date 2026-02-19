/**
 * Session Patients Helper
 * Fetches all patients for a session (individual or group).
 * Used to attach patient tags to Langfuse traces.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { sessions, users } from '@/models/Schema';

export type SessionPatient = {
  id: string;
  name: string;
  email: string | null;
};

/**
 * Fetch all patients associated with a session.
 * - Individual session: returns the single patient
 * - Group session: returns all group members' patients
 * Returns empty array on error (non-blocking for tracing).
 */
export async function getSessionPatients(sessionId: string): Promise<SessionPatient[]> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: {
        patient: { columns: { id: true, name: true, email: true } },
        group: {
          with: {
            members: {
              with: {
                patient: { columns: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!session) return [];

    // Group session: return all member patients
    if (session.groupId && session.group && !Array.isArray(session.group)) {
      const group = session.group as { members?: Array<{ patient: SessionPatient | null }> };
      const members = group.members || [];
      return members
        .map(m => m.patient)
        .filter((p): p is SessionPatient => p != null);
    }

    // Individual session: return the single patient
    if (session.patient && !Array.isArray(session.patient)) {
      return [{
        id: session.patient.id,
        name: session.patient.name,
        email: session.patient.email,
      }];
    }

    return [];
  } catch (error) {
    console.error('Error fetching session patients:', error);
    return [];
  }
}

/**
 * Fetch a single patient by ID.
 * Used when only a patientId is available (no sessionId).
 */
export async function getPatientById(patientId: string): Promise<SessionPatient | null> {
  try {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, patientId),
      columns: { id: true, name: true, email: true },
    });
    return patient || null;
  } catch (error) {
    console.error('Error fetching patient by ID:', error);
    return null;
  }
}
