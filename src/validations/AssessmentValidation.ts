/**
 * Assessment Validation Schemas
 * Zod schemas for clinical assessment management
 */

import { z } from 'zod';

export const instrumentTypeSchema = z.enum([
  'ptsd',
  'depression',
  'schizophrenia',
  'substance_use',
  'anxiety',
  'enrollment',
  'general',
]);

export const assessmentTimepointSchema = z.enum([
  'screening',
  'baseline',
  'mid_treatment',
  'post_treatment',
  'follow_up_1m',
  'follow_up_3m',
  'follow_up_6m',
  'follow_up_12m',
  'other',
]);

export const assessmentSessionStatusSchema = z.enum([
  'in_progress',
  'completed',
  'abandoned',
]);

export const instrumentStatusSchema = z.enum([
  'active',
  'inactive',
]);

export const assessmentItemTypeSchema = z.enum([
  'likert',
  'multi_choice',
  'open_text',
  'select',
  'number',
  'date',
]);

const instrumentItemSchema = z.object({
  itemNumber: z.number().int().min(1),
  questionText: z.string().min(1),
  itemType: assessmentItemTypeSchema.default('likert'),
  scaleMin: z.number().int().optional().nullable(),
  scaleMax: z.number().int().optional().nullable(),
  scaleLabels: z.record(z.string(), z.string()).optional().nullable(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional().nullable(),
  isReverseScored: z.boolean().default(false),
  subscaleName: z.string().max(100).optional().nullable(),
  isRequired: z.boolean().default(true),
});

export const createInstrumentSchema = z.object({
  name: z.string().min(1).max(50),
  fullName: z.string().min(1).max(255),
  instrumentType: instrumentTypeSchema,
  description: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  scaleMin: z.number().int().default(0),
  scaleMax: z.number().int().default(4),
  scaleLabels: z.record(z.string(), z.string()).optional().nullable(),
  scoringMethod: z.string().max(50).default('sum'),
  totalScoreRange: z.object({ min: z.number(), max: z.number() }).optional().nullable(),
  subscales: z.array(z.object({
    name: z.string(),
    items: z.array(z.number().int()),
  })).optional().nullable(),
  clinicalCutoffs: z.array(z.object({
    min: z.number(),
    max: z.number(),
    label: z.string(),
    severity: z.string().optional(),
  })).optional().nullable(),
  items: z.array(instrumentItemSchema).min(1),
});

export type CreateInstrumentInput = z.infer<typeof createInstrumentSchema>;

export const updateInstrumentStatusSchema = z.object({
  status: instrumentStatusSchema,
});

export type UpdateInstrumentStatusInput = z.infer<typeof updateInstrumentStatusSchema>;

export const updateInstrumentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  fullName: z.string().min(1).max(255).optional(),
  instrumentType: instrumentTypeSchema.optional(),
  description: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  scaleMin: z.number().int().optional(),
  scaleMax: z.number().int().optional(),
  scaleLabels: z.record(z.string(), z.string()).optional().nullable(),
  scoringMethod: z.string().max(50).optional(),
  totalScoreRange: z.object({ min: z.number(), max: z.number() }).optional().nullable(),
  subscales: z.array(z.object({
    name: z.string(),
    items: z.array(z.number().int()),
  })).optional().nullable(),
  clinicalCutoffs: z.array(z.object({
    min: z.number(),
    max: z.number(),
    label: z.string(),
    severity: z.string().optional(),
  })).optional().nullable(),
  items: z.array(instrumentItemSchema).optional(),
  status: instrumentStatusSchema.optional(),
});

export type UpdateInstrumentInput = z.infer<typeof updateInstrumentSchema>;

export const createAssessmentSessionSchema = z.object({
  instrumentId: z.string().uuid(),
  timepoint: assessmentTimepointSchema,
  sessionId: z.string().uuid().optional().nullable(),
});

export type CreateAssessmentSessionInput = z.infer<typeof createAssessmentSessionSchema>;

export const saveAssessmentResponseSchema = z.object({
  itemId: z.string().uuid(),
  responseNumeric: z.number().int().optional().nullable(),
  responseText: z.string().optional().nullable(),
  responseValue: z.string().max(255).optional().nullable(),
});

export const saveAssessmentResponsesSchema = z.object({
  responses: z.array(saveAssessmentResponseSchema).min(1),
});

export type SaveAssessmentResponsesInput = z.infer<typeof saveAssessmentResponsesSchema>;

export const completeAssessmentSchema = z.object({
  clinicianNotes: z.string().optional().nullable(),
});

export type CompleteAssessmentInput = z.infer<typeof completeAssessmentSchema>;

export const listInstrumentsQuerySchema = z.object({
  instrumentType: instrumentTypeSchema.optional(),
  status: instrumentStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListInstrumentsQueryInput = z.infer<typeof listInstrumentsQuerySchema>;

export const listAssessmentSessionsQuerySchema = z.object({
  instrumentId: z.string().uuid().optional(),
  status: assessmentSessionStatusSchema.optional(),
  timepoint: assessmentTimepointSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListAssessmentSessionsQueryInput = z.infer<typeof listAssessmentSessionsQuerySchema>;
