/**
 * Langfuse Tracing Utilities
 * Helper functions for creating traces and generations with cost tracking
 *
 * NOTE: For text models (OpenAI, Gemini, etc.), Langfuse has built-in
 * automatic cost calculation based on model name and token usage.
 * We only manually calculate costs for custom models (images, videos, etc.)
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
  userId?: string;
  sessionId?: string;
  organizationId?: string;
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
      organizationId: options?.organizationId,
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
 * Create a span for image generation
 */
export function createImageSpan(
  trace: LangfuseTraceClient | null,
  name: string,
  input: SpanInput,
): LangfuseSpanClient | null {
  if (!trace) return null;

  return trace.span({
    name,
    input: input.input,
    metadata: {
      ...input.metadata,
      type: 'image-generation',
    },
  });
}

/**
 * End an image generation span with cost
 */
export function endImageSpan(
  span: LangfuseSpanClient | null,
  model: string,
  output: SpanOutput & { imageCount?: number },
): void {
  if (!span) return;

  const perImageCost = calculateImageCost(model);
  const totalCost = perImageCost ? perImageCost * (output.imageCount || 1) : undefined;

  span.end({
    output: output.output,
    statusMessage: output.statusMessage,
    level: output.level,
    metadata: {
      model,
      imageCount: output.imageCount || 1,
      costPerImage: perImageCost,
      totalCost,
    },
  });
}

// ============================================================
// Video Generation Tracking
// ============================================================

/**
 * Create a span for video generation
 */
export function createVideoSpan(
  trace: LangfuseTraceClient | null,
  name: string,
  input: SpanInput,
): LangfuseSpanClient | null {
  if (!trace) return null;

  return trace.span({
    name,
    input: input.input,
    metadata: {
      ...input.metadata,
      type: 'video-generation',
    },
  });
}

/**
 * End a video generation span with cost
 */
export function endVideoSpan(
  span: LangfuseSpanClient | null,
  model: string,
  output: SpanOutput & { durationSeconds?: number },
): void {
  if (!span) return;

  const cost = output.durationSeconds
    ? calculateVideoCost(model, output.durationSeconds)
    : undefined;

  span.end({
    output: output.output,
    statusMessage: output.statusMessage,
    level: output.level,
    metadata: {
      model,
      durationSeconds: output.durationSeconds,
      totalCost: cost,
    },
  });
}

// ============================================================
// Transcription Tracking
// ============================================================

/**
 * Create a span for audio transcription
 */
export function createTranscriptionSpan(
  trace: LangfuseTraceClient | null,
  name: string,
  input: SpanInput,
): LangfuseSpanClient | null {
  if (!trace) return null;

  return trace.span({
    name,
    input: input.input,
    metadata: {
      ...input.metadata,
      type: 'transcription',
    },
  });
}

/**
 * End a transcription span with cost
 */
export function endTranscriptionSpan(
  span: LangfuseSpanClient | null,
  model: string,
  output: SpanOutput & { durationMinutes?: number },
): void {
  if (!span) return;

  const cost = output.durationMinutes
    ? calculateTranscriptionCost(model, output.durationMinutes)
    : undefined;

  span.end({
    output: output.output,
    statusMessage: output.statusMessage,
    level: output.level,
    metadata: {
      model,
      durationMinutes: output.durationMinutes,
      totalCost: cost,
    },
  });
}

// ============================================================
// Music Generation Tracking
// ============================================================

/**
 * Create a span for music generation
 */
export function createMusicSpan(
  trace: LangfuseTraceClient | null,
  name: string,
  input: SpanInput,
): LangfuseSpanClient | null {
  if (!trace) return null;

  return trace.span({
    name,
    input: input.input,
    metadata: {
      ...input.metadata,
      type: 'music-generation',
    },
  });
}

/**
 * End a music generation span with cost
 */
export function endMusicSpan(
  span: LangfuseSpanClient | null,
  model: string,
  output: SpanOutput & { durationMinutes?: number },
): void {
  if (!span) return;

  const cost = output.durationMinutes
    ? calculateMusicCost(model, output.durationMinutes)
    : undefined;

  span.end({
    output: output.output,
    statusMessage: output.statusMessage,
    level: output.level,
    metadata: {
      model,
      durationMinutes: output.durationMinutes,
      totalCost: cost,
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
