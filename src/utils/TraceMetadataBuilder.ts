/**
 * Trace Metadata Builder
 * Helper function to build TraceMetadata from AuthenticatedUser for Langfuse tracing
 */

import type { TraceMetadata } from '@/libs/LangfuseTracing';
import type { AuthenticatedUser } from '@/types/Organization';
import type { SessionPatient } from '@/utils/SessionPatients';

export type TraceContext = {
  user: AuthenticatedUser;
  sessionId?: string;
  patients?: SessionPatient[];
  additionalTags?: string[];
  additionalMetadata?: Record<string, unknown>;
};

/**
 * Build TraceMetadata from AuthenticatedUser context
 * Use this in API routes to pass comprehensive user context to AI calls
 *
 * @example
 * const user = await requireTherapist(request);
 * const patients = await getSessionPatients(sessionId);
 * const traceMetadata = buildTraceMetadata({
 *   user,
 *   sessionId,
 *   patients,
 *   additionalTags: ['ai-chat', model],
 * });
 */
export function buildTraceMetadata(context: TraceContext): TraceMetadata {
  const {
    user,
    sessionId,
    patients = [],
    additionalTags = [],
    additionalMetadata = {},
  } = context;

  // Generate patient tags: patient:email when available, patient-name:Name as fallback
  console.log(`[TraceMetadata] Building metadata with ${patients.length} patient(s):`, patients.map(p => ({ id: p.id, name: p.name, email: p.email ?? 'null' })));
  const patientTags = [
    ...patients.filter(p => p.email).map(p => `patient:${p.email}`),
    ...patients.map(p => `patient-name:${p.name}`),
  ];
  console.log(`[TraceMetadata] Generated patient tags:`, patientTags);

  return {
    userId: user.dbUserId,
    firebaseUid: user.uid,
    userEmail: user.email || undefined,
    userName: user.name,
    userRole: user.role,
    organizationId: user.organizationId || undefined,
    patients: patients.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email || undefined,
    })),
    sessionId,
    tags: [
      user.role,
      ...(user.email ? [`email:${user.email}`] : []),
      ...patientTags,
      ...(user.organizationId ? [`org:${user.organizationId}`] : []),
      ...additionalTags,
    ],
    metadata: {
      ...additionalMetadata,
    },
  };
}
