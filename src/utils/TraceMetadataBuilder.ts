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
    sessionId,
    tags: [
      user.role,
      ...(user.organizationId ? [`org:${user.organizationId}`] : []),
      ...additionalTags,
    ],
    metadata: {
      ...additionalMetadata,
    },
  };
}
