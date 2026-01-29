// Suno AI Music Generation Service
// API Documentation: https://sunoapi.org
// Includes Langfuse tracing for observability and cost tracking

import { flushLangfuse } from './Langfuse';
import {
  createMusicSpan,
  createTrace,
  endMusicSpan,
  type TraceMetadata,
} from './LangfuseTracing';

export type SunoGenerateOptions = {
  prompt?: string; // Description or lyrics (required if instrumental=false in custom mode)
  style?: string; // Music style/genre (required in custom mode)
  title?: string; // Track title (required in custom mode)
  customMode: boolean; // Enable custom mode for advanced settings
  instrumental: boolean; // Whether track should be instrumental
  personaId?: string; // Optional persona ID
  model?: 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5'; // Model version
  negativeTags?: string; // Styles to exclude
  vocalGender?: 'm' | 'f'; // Vocal gender preference
  styleWeight?: number; // Style guidance weight (0.00-1.00)
  weirdnessConstraint?: number; // Creative deviation constraint (0.00-1.00)
  audioWeight?: number; // Audio influence weight (0.00-1.00)
  callBackUrl?: string; // Callback URL for completion notification
  traceMetadata?: TraceMetadata;
};

export type SunoGenerateResponse = {
  code: number; // 200 = success, 400+ = error
  msg: string; // Success or error message
  data?: {
    taskId: string; // Task ID for tracking status
  };
};

export type SunoTaskStatusResponse = {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    audioUrl?: string; // Available when status is 'completed'
    title?: string;
    duration?: number;
    error?: string;
  };
};

/**
 * Get webhook callback URL for Suno API
 */
export function getWebhookUrl(baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_APP_URL not configured for webhook callbacks');
  }
  return `${url}/api/webhooks/suno`;
}

/**
 * Generate music using Suno AI API
 * @param options - Music generation options
 * @param includeCallback - Whether to include webhook callback URL (default: true)
 */
export async function generateSunoMusic(
  options: SunoGenerateOptions,
  includeCallback = true,
): Promise<SunoGenerateResponse> {
  const apiKey = process.env.SUNO_API_KEY;

  if (!apiKey) {
    throw new Error('SUNO_API_KEY environment variable is not set');
  }

  const model = options.model || 'V4_5';

  // Create Langfuse trace and span
  const trace = createTrace('suno-music', {
    ...options.traceMetadata,
    tags: ['suno', 'music-generation', model, ...(options.traceMetadata?.tags || [])],
  });

  // Update trace with input for better visibility in dashboard
  if (trace) {
    trace.update({
      input: {
        prompt: options.prompt,
        style: options.style,
        title: options.title,
        model,
        instrumental: options.instrumental,
        customMode: options.customMode,
      },
    });
  }

  const span = createMusicSpan(trace, 'generate-music', {
    name: 'suno-music-generation',
    input: {
      prompt: options.prompt,
      style: options.style,
      title: options.title,
      model,
      instrumental: options.instrumental,
      customMode: options.customMode,
    },
    metadata: {
      provider: 'suno-ai',
    },
  });

  // Validate options based on mode
  if (options.customMode) {
    if (!options.title) {
      endMusicSpan(span, model, {
        output: null,
        statusMessage: 'Title is required in custom mode',
        level: 'ERROR',
      });
      await flushLangfuse();
      throw new Error('Title is required in custom mode');
    }
    if (!options.style) {
      endMusicSpan(span, model, {
        output: null,
        statusMessage: 'Style is required in custom mode',
        level: 'ERROR',
      });
      await flushLangfuse();
      throw new Error('Style is required in custom mode');
    }
    if (!options.instrumental && !options.prompt) {
      endMusicSpan(span, model, {
        output: null,
        statusMessage: 'Prompt is required when instrumental is false',
        level: 'ERROR',
      });
      await flushLangfuse();
      throw new Error('Prompt is required when instrumental is false');
    }
  } else {
    if (!options.prompt) {
      endMusicSpan(span, model, {
        output: null,
        statusMessage: 'Prompt is required in non-custom mode',
        level: 'ERROR',
      });
      await flushLangfuse();
      throw new Error('Prompt is required in non-custom mode');
    }
  }

  // Add callback URL if not provided and includeCallback is true
  const requestOptions = {
    ...options,
    callBackUrl: options.callBackUrl || (includeCallback ? getWebhookUrl() : undefined),
  };

  try {
    console.log('[SUNO API] Request options:', JSON.stringify(requestOptions, null, 2));

    const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestOptions),
    });

    const data: SunoGenerateResponse = await response.json();
    console.log('[SUNO API] Response:', JSON.stringify(data, null, 2));

    // Handle error responses
    if (data.code !== 200) {
      const errorMessages: Record<number, string> = {
        400: 'Invalid parameters',
        401: 'Unauthorized - check SUNO_API_KEY',
        404: 'Invalid request method or path',
        405: 'Rate limit exceeded',
        413: 'Prompt or style too long',
        429: 'Insufficient credits',
        430: 'Call frequency too high - try again later',
        455: 'System maintenance',
        500: 'Server error',
      };
      const errorMessage = errorMessages[data.code] || data.msg || 'Music generation failed';

      endMusicSpan(span, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    // End span with success (duration will be calculated when task completes via webhook)
    endMusicSpan(span, model, {
      output: {
        taskId: data.data?.taskId,
      },
    });

    // Update trace with output for better visibility in dashboard
    if (trace) {
      trace.update({
        output: { taskId: data.data?.taskId, status: 'submitted' },
      });
    }

    // Flush asynchronously (don't block response)
    flushLangfuse().catch(console.error);

    return data;
  } catch (error) {
    if (span) {
      endMusicSpan(span, model, {
        output: null,
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
        level: 'ERROR',
      });
      flushLangfuse().catch(console.error);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate music with Suno AI');
  }
}

/**
 * Get music generation task status
 */
export async function getSunoTaskStatus(taskId: string): Promise<SunoTaskStatusResponse> {
  const apiKey = process.env.SUNO_API_KEY;

  if (!apiKey) {
    throw new Error('SUNO_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch(`https://api.sunoapi.org/api/v1/task/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data: SunoTaskStatusResponse = await response.json();

    if (data.code !== 200) {
      throw new Error(data.msg || 'Failed to get task status');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get Suno task status');
  }
}

/**
 * Helper to create music generation options for therapeutic use
 */
export function createTherapeuticMusicOptions(params: {
  prompt: string;
  title: string;
  instrumental?: boolean;
  duration?: number;
  mood?: string;
  model?: 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5';
}): SunoGenerateOptions {
  const {
    prompt,
    title,
    instrumental = true,
    duration: _duration = 120,
    model: _model = 'V4_5',
  } = params;

  if (!prompt) {
    throw new Error('Prompt is required for music generation');
  }

  if (!title) {
    throw new Error('Title is required for music generation');
  }

  // Try the most basic request format that Suno accepts
  if (instrumental) {
    return {
      prompt,
      customMode: false,
      instrumental: true,
    };
  } else {
    return {
      prompt,
      customMode: false,
      instrumental: false,
    };
  }
}
