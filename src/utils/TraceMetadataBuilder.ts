/**
 * Trace Metadata Builder
 * Helper function to build TraceMetadata from AuthenticatedUser for Langfuse tracing
 */

import type { TraceMetadata } from '@/libs/LangfuseTracing';
import type { AuthenticatedUser } from '@/types/Organization';

export type TraceContext = {
  user: AuthenticatedUser;
  sessionId?: string;
  patientId?: string;
  patientName?: string;
  patientEmail?: string;
  additionalTags?: string[];
  additionalMetadata?: Record<string, unknown>;
};

/**
 * Build TraceMetadata from AuthenticatedUser context
 * Use this in API routes to pass comprehensive user context to AI calls
 *
 * @example
 * const user = await requireTherapist(request);
 * const traceMetadata = buildTraceMetadata({
 *   user,
 *   sessionId,
 *   patientId: session?.patientId,
 *   patientName: session?.patient?.name,
 *   additionalTags: ['ai-chat', model],
 * });
 */
export function buildTraceMetadata(context: TraceContext): TraceMetadata {
  const {
    user,
    sessionId,
    patientId,
    patientName,
    patientEmail,
    additionalTags = [],
    additionalMetadata = {},
  } = context;

  return {
    userId: user.dbUserId,
    firebaseUid: user.uid,
    userEmail: user.email || undefined,
    userName: user.name,
    userRole: user.role,
    organizationId: user.organizationId || undefined,
    patientId,
    patientName,
    patientEmail,
    sessionId,
    tags: [
      user.role,
      ...(user.email ? [`email:${user.email}`] : []),
      ...(patientEmail ? [`patient-email:${patientEmail}`] : []),
      ...(user.organizationId ? [`org:${user.organizationId}`] : []),
      ...additionalTags,
    ],
    metadata: {
      ...additionalMetadata,
    },
  };
}
