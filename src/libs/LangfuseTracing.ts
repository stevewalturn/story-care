/**
 * Langfuse Tracing Utilities
 * Helper functions for creating traces and generations with cost tracking
 *
 * NOTE: For text models (OpenAI, Gemini, etc.), Langfuse has built-in
 * automatic cost calculation based on model name and token usage.
 * We only manually calculate costs for custom models (images, videos, etc.)
 *
 * IMPORTANT: All media generation (image, video, music, transcription) uses
 * Generation objects (not Spans) to properly track costs in Langfuse's
 * Total Cost column via the usage.totalCost field.
 */

import type { LangfuseGenerationClient, LangfuseSpanClient, LangfuseTraceClient } from 'langfuse';
import { getLangfuse } from './Langfuse';
import {
  getImageCost,
  getMusicCostPerMinute,
  getTranscriptionCostPerMinute,
  getVideoCostPerSecond,
} from './ModelPricing';

// ============================================================
// Types
// ============================================================

export type TraceMetadata = {
  userId?: string; // Database UUID (dbUserId)
  firebaseUid?: string; // Firebase UID for cross-reference
  userEmail?: string; // User's email for filtering
  userName?: string; // Display name
  userRole?: 'super_admin' | 'org_admin' | 'therapist' | 'patient';
  organizationId?: string;
  patientId?: string; // Patient's database UUID
  patientName?: string; // Patient's name
  sessionId?: string; // Therapy session ID
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type GenerationInput = {
  model: string;
  input: unknown;
  modelParameters?: Record<string, string | number | boolean | string[] | null>;
  metadata?: Record<string, unknown>;
};

export type GenerationOutput = {
  output: unknown;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  statusMessage?: string;
};

export type SpanInput = {
  name: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
};

export type SpanOutput = {
  output?: unknown;
  statusMessage?: string;
  level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
};

// ============================================================
// Cost Calculation (for custom models not auto-detected by Langfuse)
// ============================================================

/**
 * Calculate cost for image generation
 */
export function calculateImageCost(model: string, imageCount: number = 1): number | undefined {
  const perImageCost = getImageCost(model);
  if (!perImageCost) return undefined;
  return perImageCost * imageCount;
}

/**
 * Calculate cost for video generation (per second)
 */
export function calculateVideoCost(model: string, durationSeconds: number): number | undefined {
  const perSecondCost = getVideoCostPerSecond(model);
  if (!perSecondCost) return undefined;
  return perSecondCost * durationSeconds;
}

/**
 * Calculate cost for audio transcription (per minute)
 */
export function calculateTranscriptionCost(model: string, durationMinutes: number): number | undefined {
  const perMinuteCost = getTranscriptionCostPerMinute(model);
  if (!perMinuteCost) return undefined;
  return perMinuteCost * durationMinutes;
}

/**
 * Calculate cost for music generation (per minute)
 */
export function calculateMusicCost(model: string, durationMinutes: number): number | undefined {
  const perMinuteCost = getMusicCostPerMinute(model);
  if (!perMinuteCost) return undefined;
  return perMinuteCost * durationMinutes;
}

// ============================================================
// Trace Creation
// ============================================================

/**
 * Create a new trace for tracking an AI operation
 * Returns null if Langfuse is not configured
 */
export function createTrace(
  name: string,
  options?: TraceMetadata,
): LangfuseTraceClient | null {
  const langfuse = getLangfuse();
  if (!langfuse) return null;

  return langfuse.trace({
    name,
    userId: options?.userId,
    sessionId: options?.sessionId,
    tags: options?.tags,
    metadata: {
      ...options?.metadata,
      firebaseUid: options?.firebaseUid,
      userEmail: options?.userEmail,
      userName: options?.userName,
      userRole: options?.userRole,
      organizationId: options?.organizationId,
      patientId: options?.patientId,
      patientName: options?.patientName,
    },
  });
}

// ============================================================
// Text Generation Tracking
// ============================================================

/**
 * Create a generation for text/chat completions
 */
export function createTextGeneration(
  trace: LangfuseTraceClient | null,
  name: string,
  input: GenerationInput,
): LangfuseGenerationClient | null {
  if (!trace) return null;

  return trace.generation({
    name,
    model: input.model,
    input: input.input,
    modelParameters: input.modelParameters,
    metadata: input.metadata,
  });
}

/**
 * End a text generation with output
 * NOTE: Langfuse auto-calculates cost for known models (OpenAI, Gemini, etc.)
 * based on model name and token usage, so we don't need to pass cost manually
 */
export function endTextGeneration(
  generation: LangfuseGenerationClient | null,
  output: GenerationOutput,
): void {
  if (!generation) return;

  generation.end({
    output: output.output,
    usage: output.usage
      ? {
          input: output.usage.inputTokens,
          output: output.usage.outputTokens,
          total: output.usage.totalTokens,
        }
      : undefined,
    statusMessage: output.statusMessage,
  });
}

// ============================================================
// Image Generation Tracking
// ============================================================

/**
 * Create a generation for image generation
 * Using Generation allows Langfuse to properly aggregate costs via usage.totalCost
 */
export function createImageGeneration(
  trace: LangfuseTraceClient | null,
  name: string,
  input: GenerationInput,
): LangfuseGenerationClient | null {
  if (!trace) return null;

  return trace.generation({
    name,
    model: input.model,
    input: input.input,
    modelParameters: input.modelParameters,
    metadata: {
      ...input.metadata,
      type: 'image-generation',
    },
  });
}

/**
 * Default fallback costs when model not found in pricing list
 */
const FALLBACK_COSTS = {
  image: 0.02, // $0.02 per image
  video: 0.05, // $0.05 per second
  transcription: 0.005, // $0.005 per minute
  music: 0.05, // $0.05 per minute
};

/**
 * End an image generation with proper cost tracking
 * Cost is passed via usage.totalCost which Langfuse properly aggregates
 */
export function endImageGeneration(
  generation: LangfuseGenerationClient | null,
  model: string,
  output: {
    output?: unknown;
    statusMessage?: string;
    level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
    imageCount?: number;
  },
): void {
  if (!generation) return;

  const imageCount = output.imageCount || 1;
  const calculatedCost = calculateImageCost(model, imageCount);
  // Use fallback if model not in pricing list
  const totalCost = calculatedCost ?? (FALLBACK_COSTS.image * imageCount);

  generation.end({
    output: output.output,
    statusMessage: output.statusMessage,
    level: output.level,
    usage: {
      unit: 'IMAGES',
      total: imageCount,
      totalCost,
    },
    metadata: {
      model,
      imageCount,
      costSource: calculatedCost !== undefined ? 'pricing-list' : 'fallback',
    },
  });
}

// ============================================================
// Video Generation Tracking
// ============================================================

/**
 * Create a generation for video generation
 * Using Generation allows Langfuse to properly aggregate costs via usage.totalCost
 */
export function createVideoGeneration(
  trace: LangfuseTraceClient | null,
  name: string,
  input: GenerationInput,
): LangfuseGenerationClient | null {
  if (!trace) return null;

  return trace.generation({
    name,
    model: input.model,
    input: input.input,
    modelParameters: input.modelParameters,
    metadata: {
      ...input.metadata,
      type: 'video-generation',
    },
  });
}

/**
 * End a video generation with proper cost tracking
 * Cost is passed via usage.totalCost which Langfuse properly aggregates
 */
export function endVideoGeneration(
  generation: LangfuseGenerationClient | null,
  model: string,
  output: {
    output?: unknown;
    statusMessage?: string;
    level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
    durationSeconds?: number;
  },
): void {
  if (!generation) return;

  const durationSeconds = output.durationSeconds || 0;
  const calculatedCost = durationSeconds > 0
    ? calculateVideoCost(model, durationSeconds)
    : undefined;
  // Use fallback if model not in pricing list
  const totalCost = calculatedCost ?? (durationSeconds > 0 ? FALLBACK_COSTS.video * durationSeconds : 0);

  generation.end({
    output: output.output,
    statusMessage: output.statusMessage,
    level: output.level,
    usage: {
      unit: 'SECONDS',
      total: durationSeconds,
      totalCost,
    },
    metadata: {
      model,
      durationSeconds,
      costSource: calculatedCost !== undefined ? 'pricing-list' : 'fallback',
    },
  });
}

// ============================================================
// Transcription Tracking
// ============================================================

/**
 * Create a generation for audio transcription
 * Using Generation allows Langfuse to properly aggregate costs via usage.totalCost
 */
export function createTranscriptionGeneration(
  trace: LangfuseTraceClient | null,
  name: string,
  input: GenerationInput,
): LangfuseGenerationClient | null {
  if (!trace) return null;

  return trace.generation({
    name,
    model: input.model,
    input: input.input,
    modelParameters: input.modelParameters,
    metadata: {
      ...input.metadata,
      type: 'transcription',
    },
  });
}

/**
 * End a transcription generation with proper cost tracking
 * Cost is passed via usage.totalCost which Langfuse properly aggregates
 */
export function endTranscriptionGeneration(
  generation: LangfuseGenerationClient | null,
  model: string,
  output: {
    output?: unknown;
    statusMessage?: string;
    level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
    durationMinutes?: number;
  },
): void {
  if (!generation) return;

  const durationMinutes = output.durationMinutes || 0;
  const durationSeconds = durationMinutes * 60;
  const calculatedCost = durationMinutes > 0
    ? calculateTranscriptionCost(model, durationMinutes)
    : undefined;
  // Use fallback if model not in pricing list
  const totalCost = calculatedCost ?? (durationMinutes > 0 ? FALLBACK_COSTS.transcription * durationMinutes : 0);

  generation.end({
    output: output.output,
    statusMessage: output.statusMessage,
    level: output.level,
    usage: {
      unit: 'SECONDS',
      total: durationSeconds,
      totalCost,
    },
    metadata: {
      model,
      durationMinutes,
      costSource: calculatedCost !== undefined ? 'pricing-list' : 'fallback',
    },
  });
}

// ============================================================
// Music Generation Tracking
// ============================================================

/**
 * Create a generation for music generation
 * Using Generation allows Langfuse to properly aggregate costs via usage.totalCost
 */
export function createMusicGeneration(
  trace: LangfuseTraceClient | null,
  name: string,
  input: GenerationInput,
): LangfuseGenerationClient | null {
  if (!trace) return null;

  return trace.generation({
    name,
    model: input.model,
    input: input.input,
    modelParameters: input.modelParameters,
    metadata: {
      ...input.metadata,
      type: 'music-generation',
    },
  });
}

/**
 * End a music generation with proper cost tracking
 * Cost is passed via usage.totalCost which Langfuse properly aggregates
 */
export function endMusicGeneration(
  generation: LangfuseGenerationClient | null,
  model: string,
  output: {
    output?: unknown;
    statusMessage?: string;
    level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
    durationMinutes?: number;
  },
): void {
  if (!generation) return;

  const durationMinutes = output.durationMinutes || 0;
  const durationSeconds = durationMinutes * 60;
  const calculatedCost = durationMinutes > 0
    ? calculateMusicCost(model, durationMinutes)
    : undefined;
  // Use fallback if model not in pricing list
  const totalCost = calculatedCost ?? (durationMinutes > 0 ? FALLBACK_COSTS.music * durationMinutes : 0);

  generation.end({
    output: output.output,
    statusMessage: output.statusMessage,
    level: output.level,
    usage: {
      unit: 'SECONDS',
      total: durationSeconds,
      totalCost,
    },
    metadata: {
      model,
      durationMinutes,
      costSource: calculatedCost !== undefined ? 'pricing-list' : 'fallback',
    },
  });
}

// ============================================================
// Generic Span Helpers
// ============================================================

/**
 * Create a generic span for custom operations
 */
export function createSpan(
  trace: LangfuseTraceClient | null,
  name: string,
  input?: SpanInput,
): LangfuseSpanClient | null {
  if (!trace) return null;

  return trace.span({
    name,
    input: input?.input,
    metadata: input?.metadata,
  });
}

/**
 * End a generic span
 */
export function endSpan(
  span: LangfuseSpanClient | null,
  output?: SpanOutput,
): void {
  if (!span) return;

  span.end({
    output: output?.output,
    statusMessage: output?.statusMessage,
    level: output?.level,
  });
}

// ============================================================
// Convenience Wrappers
// ============================================================

/**
 * Wrapper to trace an async function with automatic error handling
 */
export async function withTrace<T>(
  name: string,
  fn: (trace: LangfuseTraceClient | null) => Promise<T>,
  options?: TraceMetadata,
): Promise<T> {
  const trace = createTrace(name, options);

  try {
    const result = await fn(trace);
    return result;
  } catch (error) {
    if (trace) {
      trace.update({
        metadata: {
          ...options?.metadata,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
    throw error;
  }
}

/**
 * Wrapper to trace an async operation within an existing trace
 */
export async function withSpan<T>(
  trace: LangfuseTraceClient | null,
  name: string,
  fn: (span: LangfuseSpanClient | null) => Promise<T>,
  input?: SpanInput,
): Promise<T> {
  const span = createSpan(trace, name, input);

  try {
    const result = await fn(span);
    return result;
  } catch (error) {
    if (span) {
      span.end({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}
