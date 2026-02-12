/**
 * Assessment Service
 * Business logic for clinical assessment instruments and sessions
 */

import type {
  AssessmentSessionStatus,
  AssessmentTimepoint,
  InstrumentStatus,
  InstrumentType,
} from '@/models/Schema';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  assessmentInstrumentItemsSchema,
  assessmentInstrumentsSchema,
  assessmentResponsesSchema,
  assessmentSessionsSchema,
  usersSchema,
} from '@/models/Schema';

// ============================================================================
// INSTRUMENTS
// ============================================================================

export async function listInstruments(params?: {
  instrumentType?: InstrumentType;
  status?: InstrumentStatus;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (params?.instrumentType) {
    conditions.push(eq(assessmentInstrumentsSchema.instrumentType, params.instrumentType));
  }

  if (params?.status) {
    conditions.push(eq(assessmentInstrumentsSchema.status, params.status));
  }

  if (params?.search) {
    const searchPattern = `%${params.search}%`;
    conditions.push(
      or(
        ilike(assessmentInstrumentsSchema.name, searchPattern),
        ilike(assessmentInstrumentsSchema.fullName, searchPattern),
      )!,
    );
  }

  const query = db
    .select()
    .from(assessmentInstrumentsSchema)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(assessmentInstrumentsSchema.name));

  if (params?.limit) {
    query.limit(params.limit);
  }

  if (params?.offset) {
    query.offset(params.offset);
  }

  return query;
}

export async function getInstrument(id: string) {
  const [instrument] = await db
    .select()
    .from(assessmentInstrumentsSchema)
    .where(eq(assessmentInstrumentsSchema.id, id))
    .limit(1);

  if (!instrument) return null;

  const items = await db
    .select()
    .from(assessmentInstrumentItemsSchema)
    .where(eq(assessmentInstrumentItemsSchema.instrumentId, id))
    .orderBy(asc(assessmentInstrumentItemsSchema.itemNumber));

  return { ...instrument, items };
}

export async function createInstrument(data: {
  name: string;
  fullName: string;
  instrumentType: InstrumentType;
  description?: string | null;
  instructions?: string | null;
  scaleMin: number;
  scaleMax: number;
  scaleLabels?: Record<string, string> | null;
  scoringMethod: string;
  totalScoreRange?: { min: number; max: number } | null;
  subscales?: Array<{ name: string; items: number[] }> | null;
  clinicalCutoffs?: Array<{ min: number; max: number; label: string; severity?: string }> | null;
  items: Array<{
    itemNumber: number;
    questionText: string;
    itemType?: string;
    scaleMin?: number | null;
    scaleMax?: number | null;
    scaleLabels?: Record<string, string> | null;
    options?: Array<{ value: string; label: string }> | null;
    isReverseScored?: boolean;
    subscaleName?: string | null;
    isRequired?: boolean;
  }>;
  createdBy?: string;
}) {
  const { items, ...instrumentData } = data;

  return db.transaction(async (tx) => {
    const [instrument] = await tx
      .insert(assessmentInstrumentsSchema)
      .values({
        ...instrumentData,
        itemCount: items.length,
      })
      .returning();

    if (items.length > 0) {
      await tx.insert(assessmentInstrumentItemsSchema).values(
        items.map(item => ({
          instrumentId: instrument!.id,
          itemNumber: item.itemNumber,
          questionText: item.questionText,
          itemType: (item.itemType as any) || 'likert',
          scaleMin: item.scaleMin ?? null,
          scaleMax: item.scaleMax ?? null,
          scaleLabels: item.scaleLabels ?? null,
          options: item.options ?? null,
          isReverseScored: item.isReverseScored ?? false,
          subscaleName: item.subscaleName ?? null,
          isRequired: item.isRequired ?? true,
        })),
      );
    }

    return instrument;
  });
}

export async function updateInstrument(
  id: string,
  data: {
    name?: string;
    fullName?: string;
    instrumentType?: InstrumentType;
    description?: string | null;
    instructions?: string | null;
    scaleMin?: number;
    scaleMax?: number;
    scaleLabels?: Record<string, string> | null;
    scoringMethod?: string;
    totalScoreRange?: { min: number; max: number } | null;
    subscales?: Array<{ name: string; items: number[] }> | null;
    clinicalCutoffs?: Array<{ min: number; max: number; label: string; severity?: string }> | null;
    status?: InstrumentStatus;
    items?: Array<{
      itemNumber: number;
      questionText: string;
      itemType?: string;
      scaleMin?: number | null;
      scaleMax?: number | null;
      scaleLabels?: Record<string, string> | null;
      options?: Array<{ value: string; label: string }> | null;
      isReverseScored?: boolean;
      subscaleName?: string | null;
      isRequired?: boolean;
    }>;
  },
) {
  const { items, ...instrumentFields } = data;

  return db.transaction(async (tx) => {
    // Update instrument fields if any provided
    const hasInstrumentFields = Object.keys(instrumentFields).length > 0 || items;
    if (!hasInstrumentFields) return null;

    const updateSet: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(instrumentFields)) {
      if (value !== undefined) {
        updateSet[key] = value;
      }
    }

    if (items) {
      updateSet.itemCount = items.length;
    }

    const [updated] = await tx
      .update(assessmentInstrumentsSchema)
      .set(updateSet)
      .where(eq(assessmentInstrumentsSchema.id, id))
      .returning();

    if (!updated) return null;

    // Replace items if provided
    if (items) {
      await tx
        .delete(assessmentInstrumentItemsSchema)
        .where(eq(assessmentInstrumentItemsSchema.instrumentId, id));

      if (items.length > 0) {
        await tx.insert(assessmentInstrumentItemsSchema).values(
          items.map(item => ({
            instrumentId: id,
            itemNumber: item.itemNumber,
            questionText: item.questionText,
            itemType: (item.itemType as any) || 'likert',
            scaleMin: item.scaleMin ?? null,
            scaleMax: item.scaleMax ?? null,
            scaleLabels: item.scaleLabels ?? null,
            options: item.options ?? null,
            isReverseScored: item.isReverseScored ?? false,
            subscaleName: item.subscaleName ?? null,
            isRequired: item.isRequired ?? true,
          })),
        );
      }
    }

    return updated;
  });
}

export async function updateInstrumentStatus(id: string, status: InstrumentStatus) {
  const [updated] = await db
    .update(assessmentInstrumentsSchema)
    .set({ status, updatedAt: new Date() })
    .where(eq(assessmentInstrumentsSchema.id, id))
    .returning();

  return updated;
}

export async function deleteInstrument(id: string) {
  // Check for existing sessions
  const [sessionCount] = await db
    .select({ count: count() })
    .from(assessmentSessionsSchema)
    .where(eq(assessmentSessionsSchema.instrumentId, id));

  if (sessionCount && sessionCount.count > 0) {
    throw new Error('Cannot delete instrument with existing assessment sessions');
  }

  const [deleted] = await db
    .delete(assessmentInstrumentsSchema)
    .where(eq(assessmentInstrumentsSchema.id, id))
    .returning();

  return deleted;
}

// ============================================================================
// SESSIONS
// ============================================================================

export async function createAssessmentSession(data: {
  patientId: string;
  therapistId: string;
  organizationId: string;
  instrumentId: string;
  timepoint: AssessmentTimepoint;
  sessionId?: string | null;
}) {
  const [session] = await db
    .insert(assessmentSessionsSchema)
    .values(data)
    .returning();

  return session;
}

export async function getAssessmentSession(id: string) {
  const [session] = await db
    .select()
    .from(assessmentSessionsSchema)
    .where(eq(assessmentSessionsSchema.id, id))
    .limit(1);

  if (!session) return null;

  // Get instrument with items
  const instrument = await getInstrument(session.instrumentId);

  // Get existing responses
  const responses = await db
    .select()
    .from(assessmentResponsesSchema)
    .where(eq(assessmentResponsesSchema.sessionId, id));

  // Get patient and therapist names
  const [patient] = await db
    .select({ id: usersSchema.id, name: usersSchema.name, email: usersSchema.email })
    .from(usersSchema)
    .where(eq(usersSchema.id, session.patientId))
    .limit(1);

  const [therapist] = await db
    .select({ id: usersSchema.id, name: usersSchema.name, email: usersSchema.email })
    .from(usersSchema)
    .where(eq(usersSchema.id, session.therapistId))
    .limit(1);

  return {
    ...session,
    instrument,
    responses,
    patient,
    therapist,
  };
}

export async function listPatientAssessments(
  patientId: string,
  params?: {
    instrumentId?: string;
    status?: AssessmentSessionStatus;
    timepoint?: AssessmentTimepoint;
    limit?: number;
    offset?: number;
  },
) {
  const conditions = [eq(assessmentSessionsSchema.patientId, patientId)];

  if (params?.instrumentId) {
    conditions.push(eq(assessmentSessionsSchema.instrumentId, params.instrumentId));
  }
  if (params?.status) {
    conditions.push(eq(assessmentSessionsSchema.status, params.status));
  }
  if (params?.timepoint) {
    conditions.push(eq(assessmentSessionsSchema.timepoint, params.timepoint));
  }

  const sessionsResult = await db
    .select({
      session: assessmentSessionsSchema,
      instrumentName: assessmentInstrumentsSchema.name,
      instrumentFullName: assessmentInstrumentsSchema.fullName,
      instrumentType: assessmentInstrumentsSchema.instrumentType,
      itemCount: assessmentInstrumentsSchema.itemCount,
    })
    .from(assessmentSessionsSchema)
    .innerJoin(
      assessmentInstrumentsSchema,
      eq(assessmentSessionsSchema.instrumentId, assessmentInstrumentsSchema.id),
    )
    .where(and(...conditions))
    .orderBy(desc(assessmentSessionsSchema.createdAt))
    .limit(params?.limit ?? 50)
    .offset(params?.offset ?? 0);

  return sessionsResult.map(r => ({
    ...r.session,
    instrumentName: r.instrumentName,
    instrumentFullName: r.instrumentFullName,
    instrumentType: r.instrumentType,
    itemCount: r.itemCount,
  }));
}

export async function updateAssessmentSession(
  id: string,
  data: {
    clinicianNotes?: string | null;
    timepoint?: AssessmentTimepoint;
    status?: 'abandoned';
  },
) {
  const [session] = await db
    .select()
    .from(assessmentSessionsSchema)
    .where(eq(assessmentSessionsSchema.id, id))
    .limit(1);

  if (!session) return null;

  // Abandoned sessions: reject all updates
  if (session.status === 'abandoned') {
    throw new Error('Cannot update an abandoned assessment');
  }

  // Completed sessions: only clinicianNotes allowed
  if (session.status === 'completed') {
    if (data.timepoint || data.status) {
      throw new Error('Completed assessments can only update clinician notes');
    }
  }

  const updateSet: Record<string, unknown> = { updatedAt: new Date() };

  if (data.clinicianNotes !== undefined) {
    updateSet.clinicianNotes = data.clinicianNotes;
  }

  if (data.timepoint && session.status === 'in_progress') {
    updateSet.timepoint = data.timepoint;
  }

  if (data.status === 'abandoned' && session.status === 'in_progress') {
    updateSet.status = 'abandoned';
  }

  const [updated] = await db
    .update(assessmentSessionsSchema)
    .set(updateSet)
    .where(eq(assessmentSessionsSchema.id, id))
    .returning();

  return updated;
}

export async function listAssessments(params: {
  therapistId?: string;
  organizationId?: string;
  patientId?: string;
  instrumentId?: string;
  status?: AssessmentSessionStatus;
  timepoint?: AssessmentTimepoint;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (params.therapistId) {
    conditions.push(eq(assessmentSessionsSchema.therapistId, params.therapistId));
  }
  if (params.organizationId) {
    conditions.push(eq(assessmentSessionsSchema.organizationId, params.organizationId));
  }
  if (params.patientId) {
    conditions.push(eq(assessmentSessionsSchema.patientId, params.patientId));
  }
  if (params.instrumentId) {
    conditions.push(eq(assessmentSessionsSchema.instrumentId, params.instrumentId));
  }
  if (params.status) {
    conditions.push(eq(assessmentSessionsSchema.status, params.status));
  }
  if (params.timepoint) {
    conditions.push(eq(assessmentSessionsSchema.timepoint, params.timepoint));
  }
  if (params.search) {
    const searchPattern = `%${params.search}%`;
    conditions.push(
      or(
        ilike(assessmentInstrumentsSchema.name, searchPattern),
        ilike(assessmentInstrumentsSchema.fullName, searchPattern),
        ilike(usersSchema.name, searchPattern),
      )!,
    );
  }

  const results = await db
    .select({
      session: assessmentSessionsSchema,
      instrumentName: assessmentInstrumentsSchema.name,
      instrumentFullName: assessmentInstrumentsSchema.fullName,
      instrumentType: assessmentInstrumentsSchema.instrumentType,
      itemCount: assessmentInstrumentsSchema.itemCount,
      patientName: usersSchema.name,
      patientEmail: usersSchema.email,
    })
    .from(assessmentSessionsSchema)
    .innerJoin(
      assessmentInstrumentsSchema,
      eq(assessmentSessionsSchema.instrumentId, assessmentInstrumentsSchema.id),
    )
    .innerJoin(
      usersSchema,
      eq(assessmentSessionsSchema.patientId, usersSchema.id),
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(assessmentSessionsSchema.createdAt))
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  return results.map(r => ({
    ...r.session,
    instrumentName: r.instrumentName,
    instrumentFullName: r.instrumentFullName,
    instrumentType: r.instrumentType,
    itemCount: r.itemCount,
    patientName: r.patientName,
    patientEmail: r.patientEmail,
  }));
}

export async function deleteAssessmentSession(id: string) {
  // Only allow deleting in-progress sessions
  const [session] = await db
    .select()
    .from(assessmentSessionsSchema)
    .where(eq(assessmentSessionsSchema.id, id))
    .limit(1);

  if (!session) return null;
  if (session.status !== 'in_progress') {
    throw new Error('Can only delete in-progress assessments');
  }

  const [deleted] = await db
    .delete(assessmentSessionsSchema)
    .where(eq(assessmentSessionsSchema.id, id))
    .returning();

  return deleted;
}

// ============================================================================
// RESPONSES
// ============================================================================

export async function saveResponses(
  sessionId: string,
  responses: Array<{
    itemId: string;
    responseNumeric?: number | null;
    responseText?: string | null;
    responseValue?: string | null;
  }>,
) {
  // Verify session exists and is in progress
  const [session] = await db
    .select()
    .from(assessmentSessionsSchema)
    .where(eq(assessmentSessionsSchema.id, sessionId))
    .limit(1);

  if (!session) throw new Error('Assessment session not found');
  if (session.status !== 'in_progress') throw new Error('Assessment is not in progress');

  // Get instrument for scoring context
  const [instrument] = await db
    .select()
    .from(assessmentInstrumentsSchema)
    .where(eq(assessmentInstrumentsSchema.id, session.instrumentId))
    .limit(1);

  // Get item details for scoring
  const itemIds = responses.map(r => r.itemId);
  const items = await db
    .select()
    .from(assessmentInstrumentItemsSchema)
    .where(sql`${assessmentInstrumentItemsSchema.id} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`);

  const itemMap = new Map(items.map(i => [i.id, i]));

  // Upsert responses
  for (const response of responses) {
    const item = itemMap.get(response.itemId);
    let scoredValue = response.responseNumeric != null ? response.responseNumeric : null;

    // Handle reverse scoring
    if (item?.isReverseScored && scoredValue != null && instrument) {
      const itemScaleMax = item.scaleMax ?? instrument.scaleMax;
      const itemScaleMin = item.scaleMin ?? instrument.scaleMin;
      scoredValue = itemScaleMax + itemScaleMin - scoredValue;
    }

    await db
      .insert(assessmentResponsesSchema)
      .values({
        sessionId,
        itemId: response.itemId,
        responseNumeric: response.responseNumeric ?? null,
        responseText: response.responseText ?? null,
        responseValue: response.responseValue ?? null,
        scoredValue: scoredValue != null ? String(scoredValue) : null,
      })
      .onConflictDoUpdate({
        target: [assessmentResponsesSchema.sessionId, assessmentResponsesSchema.itemId],
        set: {
          responseNumeric: response.responseNumeric ?? null,
          responseText: response.responseText ?? null,
          responseValue: response.responseValue ?? null,
          scoredValue: scoredValue != null ? String(scoredValue) : null,
          updatedAt: new Date(),
        },
      });
  }

  // Update session progress
  const [responseCount] = await db
    .select({ count: count() })
    .from(assessmentResponsesSchema)
    .where(eq(assessmentResponsesSchema.sessionId, sessionId));

  const totalItems = instrument?.itemCount ?? 0;
  const answeredItems = responseCount?.count ?? 0;
  const percentComplete = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;

  // Find the highest item number answered
  const maxItemNumber = Math.max(
    ...responses.map((r) => {
      const item = itemMap.get(r.itemId);
      return item?.itemNumber ?? 0;
    }),
    session.lastItemNumber ?? 0,
  );

  await db
    .update(assessmentSessionsSchema)
    .set({
      percentComplete,
      lastItemNumber: maxItemNumber,
      updatedAt: new Date(),
    })
    .where(eq(assessmentSessionsSchema.id, sessionId));

  return { percentComplete, answeredItems, totalItems };
}

// ============================================================================
// SCORING
// ============================================================================

export async function completeAssessment(sessionId: string, clinicianNotes?: string | null) {
  const [session] = await db
    .select()
    .from(assessmentSessionsSchema)
    .where(eq(assessmentSessionsSchema.id, sessionId))
    .limit(1);

  if (!session) throw new Error('Assessment session not found');
  if (session.status !== 'in_progress') throw new Error('Assessment is not in progress');

  // Get instrument
  const [instrument] = await db
    .select()
    .from(assessmentInstrumentsSchema)
    .where(eq(assessmentInstrumentsSchema.id, session.instrumentId))
    .limit(1);

  if (!instrument) throw new Error('Assessment instrument not found');

  // Get all responses with their items
  const responses = await db
    .select({
      response: assessmentResponsesSchema,
      itemNumber: assessmentInstrumentItemsSchema.itemNumber,
      subscaleName: assessmentInstrumentItemsSchema.subscaleName,
      isReverseScored: assessmentInstrumentItemsSchema.isReverseScored,
      itemScaleMin: assessmentInstrumentItemsSchema.scaleMin,
      itemScaleMax: assessmentInstrumentItemsSchema.scaleMax,
    })
    .from(assessmentResponsesSchema)
    .innerJoin(
      assessmentInstrumentItemsSchema,
      eq(assessmentResponsesSchema.itemId, assessmentInstrumentItemsSchema.id),
    )
    .where(eq(assessmentResponsesSchema.sessionId, sessionId));

  // Calculate total score
  let totalScore = 0;
  const subscaleScores: Record<string, number> = {};

  for (const r of responses) {
    const scoredValue = r.response.scoredValue != null
      ? Number.parseFloat(r.response.scoredValue)
      : (r.response.responseNumeric ?? 0);

    totalScore += scoredValue;

    // Accumulate subscale scores
    if (r.subscaleName) {
      subscaleScores[r.subscaleName] = (subscaleScores[r.subscaleName] ?? 0) + scoredValue;
    }
  }

  const now = new Date();
  const [updated] = await db
    .update(assessmentSessionsSchema)
    .set({
      status: 'completed',
      totalScore: String(totalScore),
      subscaleScores: Object.keys(subscaleScores).length > 0 ? subscaleScores : null,
      percentComplete: 100,
      clinicianNotes: clinicianNotes ?? session.clinicianNotes,
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(assessmentSessionsSchema.id, sessionId))
    .returning();

  // Determine clinical interpretation
  let interpretation: string | null = null;
  const cutoffs = instrument.clinicalCutoffs as Array<{ min: number; max: number; label: string }> | null;
  if (cutoffs) {
    for (const cutoff of cutoffs) {
      if (totalScore >= cutoff.min && totalScore <= cutoff.max) {
        interpretation = cutoff.label;
        break;
      }
    }
  }

  return {
    ...updated,
    interpretation,
    subscaleScores,
  };
}
