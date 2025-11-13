/**
 * Template Validation Schemas
 * Zod schemas for survey and reflection template management
 */

import { z } from 'zod';

/**
 * Template scope enum
 */
export const templateScopeSchema = z.enum(['system', 'organization', 'private']);

/**
 * Template status enum
 */
export const templateStatusSchema = z.enum([
  'active',
  'pending_approval',
  'rejected',
  'archived',
]);

/**
 * Survey/Reflection question schema
 */
export const questionSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().min(5).max(500),
  type: z.enum(['open_text', 'multiple_choice', 'scale', 'emotion']), // Aligned with database enum
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For multiple_choice and emotion
  scaleMin: z.number().optional(), // For scale type
  scaleMax: z.number().optional(), // For scale type
  scaleMinLabel: z.string().optional(), // For scale type
  scaleMaxLabel: z.string().optional(), // For scale type
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Template category enum (aligned with database)
 */
export const templateCategorySchema = z.enum([
  'screening',
  'outcome',
  'satisfaction',
  'custom',
  'narrative',
  'emotion',
  'goal-setting',
]);

/**
 * Create survey template schema
 */
export const createSurveyTemplateSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  category: templateCategorySchema.default('custom'),
  questions: z.array(questionSchema).min(1),
  scope: templateScopeSchema.default('private'),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Create reflection template schema
 */
export const createReflectionTemplateSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  category: templateCategorySchema.default('custom'),
  questions: z.array(questionSchema).min(1),
  scope: templateScopeSchema.default('private'),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Update template schema
 */
export const updateTemplateSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().optional(),
  questions: z.array(questionSchema).optional(),
  status: templateStatusSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Submit template for approval schema
 */
export const submitForApprovalSchema = z.object({
  templateId: z.string().uuid(),
});

/**
 * Approve template schema
 */
export const approveTemplateSchema = z.object({
  templateId: z.string().uuid(),
});

/**
 * Reject template schema
 */
export const rejectTemplateSchema = z.object({
  templateId: z.string().uuid(),
  reason: z.string().min(10).max(500),
});
