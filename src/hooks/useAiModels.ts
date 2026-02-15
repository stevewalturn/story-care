/**
 * Hook for fetching AI models from the database
 * Replaces hardcoded ModelMetadata.ts usage
 */

'use client';

import type { ModelCategory } from '@/models/Schema';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type AiModel = {
  id: string;
  modelId: string;
  displayName: string;
  description: string | null;
  category: ModelCategory;
  provider: string;
  providerGroup: string | null;
  status: string;
  sortOrder: number;
  costPerUnit: string | null;
  pricingUnit: string | null;
  capabilities: {
    supportsReference?: boolean;
    maxReferenceImages?: number;
    supportsPrompt?: boolean;
    maxOutputDuration?: number;
    maxResolution?: string;
  };
  apiModelId: string | null;
  apiProvider: string | null;
};

type GroupedModels = Record<string, AiModel[]>;

// Cache for models to avoid repeated API calls
const modelCache: Record<string, { data: GroupedModels; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to fetch models for a specific category
 */
export function useModelsForCategory(category: ModelCategory) {
  const { user } = useAuth();
  const [models, setModels] = useState<GroupedModels>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `category:${category}`;
      const cached = modelCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setModels(cached.data);
        setLoading(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/models?category=${category}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }

        const data = await response.json();
        const groupedModels = data.models || {};

        // Update cache
        modelCache[cacheKey] = { data: groupedModels, timestamp: Date.now() };

        setModels(groupedModels);
        setError(null);
      } catch (err) {
        console.error('Error fetching models:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [user, category]);

  // Get flat list of all models
  const allModels = Object.values(models).flat();

  // Find a specific model by modelId
  const findModel = useCallback(
    (modelId: string) => allModels.find(m => m.modelId === modelId),
    [allModels],
  );

  return {
    models, // Grouped by providerGroup
    allModels, // Flat list
    loading,
    error,
    findModel,
  };
}

/**
 * Hook to fetch image models with optional filtering for reference support
 */
export function useImageModels(requiresReference: boolean = false) {
  const { models: textToImageModels, loading: loading1, error: error1 } = useModelsForCategory('text_to_image');
  const { models: imageToImageModels, loading: loading2, error: error2 } = useModelsForCategory('image_to_image');

  // Combine based on requiresReference
  const models = requiresReference ? imageToImageModels : textToImageModels;
  const allModels = Object.values(models).flat();

  // Find model with capabilities
  const findModel = useCallback(
    (modelId: string) => {
      // Search in both categories
      const allCombined = [
        ...Object.values(textToImageModels).flat(),
        ...Object.values(imageToImageModels).flat(),
      ];
      return allCombined.find(m => m.modelId === modelId);
    },
    [textToImageModels, imageToImageModels],
  );

  return {
    models,
    allModels,
    loading: loading1 || loading2,
    error: error1 || error2,
    findModel,
  };
}

/**
 * Hook to fetch video models (both Image-to-Video and Text-to-Video)
 */
export function useVideoModels() {
  const { models: i2vModels, allModels: allI2v, loading: l1, error: e1, findModel: findI2v } = useModelsForCategory('image_to_video');
  const { models: t2vModels, allModels: allT2v, loading: l2, error: e2, findModel: findT2v } = useModelsForCategory('text_to_video');

  // Merge with T2V models first so users see them at the top
  const models = { ...t2vModels, ...i2vModels };
  const allModels = [...allT2v, ...allI2v];

  const findModel = useCallback(
    (modelId: string) => findT2v(modelId) || findI2v(modelId),
    [findT2v, findI2v],
  );

  return {
    models,
    allModels,
    loading: l1 || l2,
    error: e1 || e2,
    findModel,
  };
}

/**
 * Hook to fetch text/chat models
 */
export function useTextModels() {
  return useModelsForCategory('text_to_text');
}

/**
 * Hook to fetch music generation models
 */
export function useMusicModels() {
  return useModelsForCategory('music_generation');
}

/**
 * Hook to fetch transcription models
 */
export function useTranscriptionModels() {
  return useModelsForCategory('transcription');
}

/**
 * Clear the model cache (useful after admin updates)
 */
export function clearModelCache() {
  Object.keys(modelCache).forEach(key => delete modelCache[key]);
}
