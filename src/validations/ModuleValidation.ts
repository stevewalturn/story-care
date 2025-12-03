/**
 * Module Validation Schemas
 * Zod schemas for treatment module management
 */

import { z } from 'zod';
import { templateScopeSchema } from './TemplateValidation';

/**
 * Therapeutic domain enum
 */
export const therapeuticDomainSchema = z.enum([
  'self_strength',
  'relationships_repair',
  'identity_transformation',
  'purpose_future',
]);

/**
 * Module status enum
 */
export const moduleStatusSchema = z.enum(['active', 'archived', 'pending_approval']);

/**
 * Create treatment module schema
 */
export const createModuleSchema = z.object({
  name: z.string().min(3).max(255),
  domain: therapeuticDomainSchema,
  description: z.string().min(10).max(5000),
  scope: templateScopeSchema.default('private'),
  aiPromptText: z.string().min(50).max(10000),
  aiPromptMetadata: z.record(z.string(), z.any()).optional(),
  linkedPromptIds: z.array(z.string().uuid()).default([]),
});

/**
 * Update module schema
 */
export const updateModuleSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().min(10).max(5000).optional(),
  aiPromptText: z.string().min(50).max(10000).optional(),
  aiPromptMetadata: z.record(z.string(), z.any()).optional(),
  linkedPromptIds: z.array(z.string().uuid()).optional(),
  status: moduleStatusSchema.optional(),
});

/**
 * Assign module to session schema
 */
export const assignModuleToSessionSchema = z.object({
  moduleId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

/**
 * Analyze session with module schema
 */
export const analyzeSessionWithModuleSchema = z.object({
  selectedText: z.string().optional(),
});

/**
 * Generate story page from module schema
 */
export const generateStoryPageFromModuleSchema = z.object({
  sessionId: z.string().uuid(),
  patientId: z.string().uuid(),
  includeMedia: z.boolean().default(false),
  sendNotification: z.boolean().default(false),
  customTitle: z.string().max(255).optional(),
  customMessage: z.string().max(1000).optional(),
});

/**
 * Query parameters for listing modules
 */
export const listModulesQuerySchema = z.object({
  scope: templateScopeSchema.optional(),
  domain: therapeuticDomainSchema.optional(),
  status: moduleStatusSchema.optional(),
});
