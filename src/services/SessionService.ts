/**
 * Session Service
 * Business logic for session and module assignment management
 */

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  sessionModulesSchema,
  sessionsSchema,
  treatmentModulesSchema,
} from '@/models/Schema';
import { incrementModuleUseCount } from './ModuleService';

/**
 * Assign module to session
 */
export async function assignModuleToSession(params: {
  sessionId: string;
  moduleId: string;
  assignedBy: string;
  notes?: string;
}) {
  // Check if module already assigned to this session
  const existing = await db
    .select()
    .from(sessionModulesSchema)
    .where(eq(sessionModulesSchema.sessionId, params.sessionId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing assignment
    const [updated] = await db
      .update(sessionModulesSchema)
      .set({
        moduleId: params.moduleId,
        assignedBy: params.assignedBy,
        assignedAt: new Date(),
        notes: params.notes || null,
        aiAnalysisCompleted: false, // Reset analysis status
        aiAnalysisResult: null,
      })
      .where(eq(sessionModulesSchema.sessionId, params.sessionId))
      .returning();

    // Update session table for quick reference
    await db
      .update(sessionsSchema)
      .set({
        moduleId: params.moduleId,
        moduleAssignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessionsSchema.id, params.sessionId));

    return updated;
  }

  // Create new assignment
  const [sessionModule] = await db
    .insert(sessionModulesSchema)
    .values({
      sessionId: params.sessionId,
      moduleId: params.moduleId,
      assignedBy: params.assignedBy,
      assignedAt: new Date(),
      notes: params.notes || null,
      aiAnalysisCompleted: false,
      aiAnalysisResult: null,
      createdAt: new Date(),
    })
    .returning();

  // Update session table for quick reference
  await db
    .update(sessionsSchema)
    .set({
      moduleId: params.moduleId,
      moduleAssignedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sessionsSchema.id, params.sessionId));

  // Increment module use count
  await incrementModuleUseCount(params.moduleId);

  return sessionModule;
}

/**
 * Get session with module information
 */
export async function getSessionWithModule(sessionId: string) {
  const [session] = await db
    .select()
    .from(sessionsSchema)
    .where(eq(sessionsSchema.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error('Session not found');
  }

  // Get module assignment if exists
  let sessionModule = null;
  let module = null;

  if (session.moduleId) {
    const [sm] = await db
      .select()
      .from(sessionModulesSchema)
      .where(eq(sessionModulesSchema.sessionId, sessionId))
      .limit(1);

    sessionModule = sm || null;

    if (session.moduleId) {
      const [mod] = await db
        .select()
        .from(treatmentModulesSchema)
        .where(eq(treatmentModulesSchema.id, session.moduleId))
        .limit(1);

      module = mod || null;
    }
  }

  return {
    session,
    sessionModule,
    module,
  };
}

/**
 * Update AI analysis result for session-module
 */
export async function updateSessionModuleAnalysis(
  sessionId: string,
  analysisResult: any,
) {
  const [updated] = await db
    .update(sessionModulesSchema)
    .set({
      aiAnalysisCompleted: true,
      aiAnalysisResult: analysisResult,
    })
    .where(eq(sessionModulesSchema.sessionId, sessionId))
    .returning();

  return updated;
}

/**
 * Link generated story page to session-module
 */
export async function linkStoryPageToSessionModule(
  sessionId: string,
  storyPageId: string,
) {
  const [updated] = await db
    .update(sessionModulesSchema)
    .set({
      storyPageId,
      storyPageGeneratedAt: new Date(),
    })
    .where(eq(sessionModulesSchema.sessionId, sessionId))
    .returning();

  return updated;
}

/**
 * Get sessions by module ID
 */
export async function getSessionsByModule(moduleId: string, limit = 10) {
  const sessions = await db
    .select({
      session: sessionsSchema,
      sessionModule: sessionModulesSchema,
    })
    .from(sessionsSchema)
    .innerJoin(
      sessionModulesSchema,
      eq(sessionsSchema.id, sessionModulesSchema.sessionId),
    )
    .where(eq(sessionModulesSchema.moduleId, moduleId))
    .orderBy(desc(sessionsSchema.createdAt))
    .limit(limit);

  return sessions;
}

/**
 * Get session-module by session ID
 */
export async function getSessionModuleBySessionId(sessionId: string) {
  const [sessionModule] = await db
    .select()
    .from(sessionModulesSchema)
    .where(eq(sessionModulesSchema.sessionId, sessionId))
    .limit(1);

  return sessionModule || null;
}

/**
 * Remove module assignment from session
 */
export async function removeModuleFromSession(sessionId: string) {
  // Delete session_modules record
  await db
    .delete(sessionModulesSchema)
    .where(eq(sessionModulesSchema.sessionId, sessionId));

  // Clear module reference in sessions table
  await db
    .update(sessionsSchema)
    .set({
      moduleId: null,
      moduleAssignedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(sessionsSchema.id, sessionId));
}

/**
 * Get all sessions with their modules (for therapist dashboard)
 */
export async function getSessionsWithModules(params: {
  therapistId?: string;
  patientId?: string;
  moduleId?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (params.therapistId) {
    conditions.push(eq(sessionsSchema.therapistId, params.therapistId));
  }

  if (params.patientId) {
    conditions.push(eq(sessionsSchema.patientId, params.patientId));
  }

  if (params.moduleId) {
    conditions.push(eq(sessionsSchema.moduleId, params.moduleId));
  }

  const sessions = await db
    .select({
      session: sessionsSchema,
      sessionModule: sessionModulesSchema,
      module: treatmentModulesSchema,
    })
    .from(sessionsSchema)
    .leftJoin(
      sessionModulesSchema,
      eq(sessionsSchema.id, sessionModulesSchema.sessionId),
    )
    .leftJoin(
      treatmentModulesSchema,
      eq(sessionModulesSchema.moduleId, treatmentModulesSchema.id),
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sessionsSchema.createdAt))
    .limit(params.limit || 20)
    .offset(params.offset || 0);

  return sessions;
}

/**
 * Check if session has completed AI analysis
 */
export async function hasCompletedModuleAnalysis(sessionId: string): Promise<boolean> {
  const [sessionModule] = await db
    .select({
      aiAnalysisCompleted: sessionModulesSchema.aiAnalysisCompleted,
    })
    .from(sessionModulesSchema)
    .where(eq(sessionModulesSchema.sessionId, sessionId))
    .limit(1);

  return sessionModule?.aiAnalysisCompleted ?? false;
}
