/**
 * Session Patients Helper
 * Fetches all patients for a session (individual or group).
 * Used to attach patient tags to Langfuse traces.
 */

import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { groupMembers, sessions, speakers, transcripts, users } from '@/models/Schema';

export type SessionPatient = {
  id: string;
  name: string;
  email: string | null;
};

/**
 * Fetch patients via session-level FKs (patientId or groupId).
 * Uses explicit separate queries instead of nested .with() to avoid Drizzle relation errors.
 */
async function getSessionPatientsFromRelations(sessionId: string): Promise<SessionPatient[]> {
  const [session] = await db
    .select({ patientId: sessions.patientId, groupId: sessions.groupId })
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  if (!session) {
    console.log(`[SessionPatients] Session ${sessionId} not found`);
    return [];
  }

  console.log(`[SessionPatients] Session ${sessionId}: patientId=${session.patientId ?? 'null'}, groupId=${session.groupId ?? 'null'}`);

  // Individual session: fetch the linked patient directly
  if (session.patientId) {
    const [patient] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.patientId));

    if (patient) {
      console.log(`[SessionPatients] Found patient: id=${patient.id}, name=${patient.name}, email=${patient.email ?? 'null'}`);
      return [{ id: patient.id, name: patient.name, email: patient.email }];
    }

    console.log(`[SessionPatients] patientId=${session.patientId} set but user not found`);
    return [];
  }

  // Group session: fetch all member patients via join
  if (session.groupId) {
    const members = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.patientId, users.id))
      .where(eq(groupMembers.groupId, session.groupId));

    console.log(`[SessionPatients] Found ${members.length} group member(s) for group ${session.groupId}`);
    return members.map(m => ({ id: m.id, name: m.name, email: m.email }));
  }

  return [];
}

/**
 * Fetch patients via speakers table fallback.
 * Looks for speakers with speakerType 'patient' or 'group_member' that have a userId set.
 */
async function getSessionPatientsFromSpeakers(sessionId: string): Promise<SessionPatient[]> {
  // Get transcript IDs for this session
  const sessionTranscripts = await db
    .select({ id: transcripts.id })
    .from(transcripts)
    .where(eq(transcripts.sessionId, sessionId));

  if (sessionTranscripts.length === 0) return [];

  const transcriptIds = sessionTranscripts.map(t => t.id);

  // Find speakers that are patients/group_members with a linked userId
  const patientSpeakers = await db
    .select({ userId: speakers.userId })
    .from(speakers)
    .where(
      and(
        inArray(speakers.transcriptId, transcriptIds),
        inArray(speakers.speakerType, ['patient', 'group_member']),
      ),
    )
    .then(rows =>
      rows.filter(
        r => r.userId != null,
      ),
    );

  if (patientSpeakers.length === 0) return [];

  // Deduplicate user IDs
  const uniqueUserIds = [...new Set(patientSpeakers.map(s => s.userId!))];

  // Fetch user details
  const patientUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, uniqueUserIds));

  return patientUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
  }));
}

/**
 * Fetch all patients associated with a session.
 * Resolution priority:
 * 1. Session patientId — individual session direct FK
 * 2. Session groupId -> group members — group session FK
 * 3. Speakers fallback — speakers with speakerType patient/group_member and userId set
 * Returns empty array on error (non-blocking for tracing).
 */
export async function getSessionPatients(sessionId: string): Promise<SessionPatient[]> {
  try {
    // Try session-level FKs first (patientId / groupId)
    const patients = await getSessionPatientsFromRelations(sessionId);
    if (patients.length > 0) return patients;

    // Fallback: resolve from speakers table
    console.log(`[SessionPatients] No patients from session FKs for session ${sessionId}, trying speakers fallback`);
    const speakerPatients = await getSessionPatientsFromSpeakers(sessionId);

    if (speakerPatients.length === 0) {
      console.log(`[SessionPatients] No patients found for session ${sessionId}`);
    }

    return speakerPatients;
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
