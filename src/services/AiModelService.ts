/**
 * AI Model Service
 * Business logic for AI model management
 */

import type { ModelCategory, ModelStatus } from '@/models/Schema';
import { and, asc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { aiModelsSchema } from '@/models/Schema';

/**
 * Get all AI models with optional filtering
 */
export async function listAiModels(params?: {
  category?: ModelCategory;
  status?: ModelStatus;
  provider?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (params?.category) {
    conditions.push(eq(aiModelsSchema.category, params.category));
  }

  if (params?.status) {
    conditions.push(eq(aiModelsSchema.status, params.status));
  }

  if (params?.provider) {
    conditions.push(eq(aiModelsSchema.provider, params.provider));
  }

  if (params?.search) {
    const searchPattern = `%${params.search}%`;
    conditions.push(
      or(
        ilike(aiModelsSchema.modelId, searchPattern),
        ilike(aiModelsSchema.displayName, searchPattern),
        ilike(aiModelsSchema.provider, searchPattern),
        ilike(aiModelsSchema.providerGroup, searchPattern),
      )!,
    );
  }

  const query = db
    .select()
    .from(aiModelsSchema)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      asc(aiModelsSchema.category),
      asc(aiModelsSchema.sortOrder),
      asc(aiModelsSchema.displayName),
    );

  if (params?.limit) {
    query.limit(params.limit);
  }

  if (params?.offset) {
    query.offset(params.offset);
  }

  const models = await query;
  return models;
}

/**
 * Get models for a specific category (active only)
 * Used by application to get available models for generation
 */
export async function getModelsForCategory(category: ModelCategory) {
  const models = await db
    .select()
    .from(aiModelsSchema)
    .where(
      and(
        eq(aiModelsSchema.category, category),
        eq(aiModelsSchema.status, 'active'),
      ),
    )
    .orderBy(asc(aiModelsSchema.sortOrder), asc(aiModelsSchema.displayName));

  // Group by provider
  const grouped: Record<string, typeof models> = {};
  for (const model of models) {
    const group = model.providerGroup || model.provider;
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(model);
  }

  return grouped;
}

/**
 * Get a single AI model by ID
 */
export async function getAiModelById(id: string) {
  const [model] = await db
    .select()
    .from(aiModelsSchema)
    .where(eq(aiModelsSchema.id, id))
    .limit(1);

  return model || null;
}

/**
 * Get a single AI model by model ID (the string identifier)
 */
export async function getAiModelByModelId(modelId: string) {
  const [model] = await db
    .select()
    .from(aiModelsSchema)
    .where(eq(aiModelsSchema.modelId, modelId))
    .limit(1);

  return model || null;
}

/**
 * Validate if a model ID is valid and active
 */
export async function isValidModel(modelId: string): Promise<boolean> {
  const model = await getAiModelByModelId(modelId);
  return model !== null && model.status === 'active';
}

/**
 * Get model cost per unit
 */
export async function getModelCost(modelId: string): Promise<number | null> {
  const model = await getAiModelByModelId(modelId);
  if (!model || !model.costPerUnit) {
    return null;
  }
  return Number.parseFloat(model.costPerUnit);
}

/**
 * Get API model ID for a given internal model ID
 */
export async function getApiModelId(modelId: string): Promise<string | null> {
  const model = await getAiModelByModelId(modelId);
  if (!model) {
    return null;
  }
  return model.apiModelId || model.modelId;
}

/**
 * Create a new AI model
 */
export async function createAiModel(data: {
  modelId: string;
  displayName: string;
  description?: string | null;
  category: ModelCategory;
  provider: string;
  providerGroup?: string | null;
  status?: ModelStatus;
  sortOrder?: number;
  costPerUnit?: string | null;
  pricingUnit?: 'per_image' | 'per_second' | 'per_minute' | 'per_1k_tokens' | 'per_request' | null;
  capabilities?: {
    supportsReference?: boolean;
    maxReferenceImages?: number;
    supportsPrompt?: boolean;
    maxOutputDuration?: number;
    maxResolution?: string;
  };
  apiModelId?: string | null;
  apiProvider?: string | null;
}) {
  const [model] = await db
    .insert(aiModelsSchema)
    .values({
      modelId: data.modelId,
      displayName: data.displayName,
      description: data.description || null,
      category: data.category,
      provider: data.provider,
      providerGroup: data.providerGroup || null,
      status: data.status || 'active',
      sortOrder: data.sortOrder || 0,
      costPerUnit: data.costPerUnit || null,
      pricingUnit: data.pricingUnit || null,
      capabilities: data.capabilities || {},
      apiModelId: data.apiModelId || null,
      apiProvider: data.apiProvider || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return model;
}

/**
 * Update an AI model
 */
export async function updateAiModel(
  id: string,
  updates: {
    displayName?: string;
    description?: string | null;
    provider?: string;
    providerGroup?: string | null;
    status?: ModelStatus;
    sortOrder?: number;
    costPerUnit?: string | null;
    pricingUnit?: 'per_image' | 'per_second' | 'per_minute' | 'per_1k_tokens' | 'per_request' | null;
    capabilities?: {
      supportsReference?: boolean;
      maxReferenceImages?: number;
      supportsPrompt?: boolean;
      maxOutputDuration?: number;
      maxResolution?: string;
    };
    apiModelId?: string | null;
    apiProvider?: string | null;
  },
) {
  const [updated] = await db
    .update(aiModelsSchema)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(aiModelsSchema.id, id))
    .returning();

  return updated;
}

/**
 * Bulk update model status
 */
export async function bulkUpdateModelStatus(
  modelIds: string[],
  status: ModelStatus,
) {
  const updated = await db
    .update(aiModelsSchema)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      or(...modelIds.map(id => eq(aiModelsSchema.id, id)))!,
    )
    .returning();

  return updated;
}

/**
 * Delete an AI model (hard delete)
 */
export async function deleteAiModel(id: string) {
  const [deleted] = await db
    .delete(aiModelsSchema)
    .where(eq(aiModelsSchema.id, id))
    .returning();

  return deleted;
}

/**
 * Get model counts by category
 */
export async function getModelCountsByCategory() {
  const models = await db.select().from(aiModelsSchema);

  const counts: Record<string, { total: number; active: number; hidden: number; disabled: number }> = {};

  for (const model of models) {
    if (!counts[model.category]) {
      counts[model.category] = { total: 0, active: 0, hidden: 0, disabled: 0 };
    }
    const categoryCount = counts[model.category]!;
    categoryCount.total++;
    if (model.status === 'active') categoryCount.active++;
    if (model.status === 'hidden') categoryCount.hidden++;
    if (model.status === 'disabled' || model.status === 'deprecated') categoryCount.disabled++;
  }

  return counts;
}

/**
 * Get unique providers
 */
export async function getUniqueProviders() {
  const models = await db
    .selectDistinct({ provider: aiModelsSchema.provider })
    .from(aiModelsSchema)
    .orderBy(asc(aiModelsSchema.provider));

  return models.map(m => m.provider);
}

/**
 * Upsert AI model (for seeding)
 * Updates if modelId exists, creates if not
 */
export async function upsertAiModel(data: {
  modelId: string;
  displayName: string;
  description?: string | null;
  category: ModelCategory;
  provider: string;
  providerGroup?: string | null;
  status?: ModelStatus;
  sortOrder?: number;
  costPerUnit?: string | null;
  pricingUnit?: 'per_image' | 'per_second' | 'per_minute' | 'per_1k_tokens' | 'per_request' | null;
  capabilities?: {
    supportsReference?: boolean;
    maxReferenceImages?: number;
    supportsPrompt?: boolean;
    maxOutputDuration?: number;
    maxResolution?: string;
  };
  apiModelId?: string | null;
  apiProvider?: string | null;
}) {
  const existing = await getAiModelByModelId(data.modelId);

  if (existing) {
    return updateAiModel(existing.id, {
      displayName: data.displayName,
      description: data.description,
      provider: data.provider,
      providerGroup: data.providerGroup,
      sortOrder: data.sortOrder,
      costPerUnit: data.costPerUnit,
      pricingUnit: data.pricingUnit,
      capabilities: data.capabilities,
      apiModelId: data.apiModelId,
      apiProvider: data.apiProvider,
      // Don't update status to preserve admin changes
    });
  }

  return createAiModel(data);
}
