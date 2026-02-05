/**
 * AI Model Validation Schemas
 * Zod schemas for AI model management
 */

import { z } from 'zod';

/**
 * Model category enum schema
 */
export const modelCategorySchema = z.enum([
  'text_to_image',
  'image_to_image',
  'image_to_text',
  'text_to_text',
  'text_to_video',
  'image_to_video',
  'music_generation',
  'transcription',
]);

export type ModelCategoryType = z.infer<typeof modelCategorySchema>;

/**
 * Model status enum schema
 */
export const modelStatusSchema = z.enum([
  'active',
  'hidden',
  'deprecated',
  'disabled',
]);

export type ModelStatusType = z.infer<typeof modelStatusSchema>;

/**
 * Pricing unit enum schema
 */
export const pricingUnitSchema = z.enum([
  'per_image',
  'per_second',
  'per_minute',
  'per_1k_tokens',
  'per_request',
]);

export type PricingUnitType = z.infer<typeof pricingUnitSchema>;

/**
 * Model capabilities schema
 */
export const modelCapabilitiesSchema = z.object({
  supportsReference: z.boolean().optional(),
  maxReferenceImages: z.number().int().min(0).optional(),
  supportsPrompt: z.boolean().optional(),
  maxOutputDuration: z.number().positive().optional(),
  maxResolution: z.string().optional(),
}).optional();

/**
 * Create AI model schema
 */
export const createAiModelSchema = z.object({
  modelId: z.string().min(1).max(100),
  displayName: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  category: modelCategorySchema,
  provider: z.string().min(1).max(100),
  providerGroup: z.string().max(100).optional().nullable(),
  status: modelStatusSchema.default('active'),
  sortOrder: z.number().int().default(0),
  costPerUnit: z.string().optional().nullable(), // Decimal comes as string
  pricingUnit: pricingUnitSchema.optional().nullable(),
  capabilities: modelCapabilitiesSchema,
  apiModelId: z.string().max(255).optional().nullable(),
  apiProvider: z.string().max(100).optional().nullable(),
});

export type CreateAiModelInput = z.infer<typeof createAiModelSchema>;

/**
 * Update AI model schema
 */
export const updateAiModelSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  provider: z.string().min(1).max(100).optional(),
  providerGroup: z.string().max(100).optional().nullable(),
  status: modelStatusSchema.optional(),
  sortOrder: z.number().int().optional(),
  costPerUnit: z.string().optional().nullable(),
  pricingUnit: pricingUnitSchema.optional().nullable(),
  capabilities: modelCapabilitiesSchema,
  apiModelId: z.string().max(255).optional().nullable(),
  apiProvider: z.string().max(100).optional().nullable(),
});

export type UpdateAiModelInput = z.infer<typeof updateAiModelSchema>;

/**
 * Bulk update status schema
 */
export const bulkUpdateStatusSchema = z.object({
  modelIds: z.array(z.string().uuid()).min(1, 'At least one model ID required'),
  status: modelStatusSchema,
});

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;

/**
 * Query parameters for listing models
 */
export const listModelsQuerySchema = z.object({
  category: modelCategorySchema.optional(),
  status: modelStatusSchema.optional(),
  provider: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListModelsQueryInput = z.infer<typeof listModelsQuerySchema>;
