// Suno AI Music Generation Service
// API Documentation: https://sunoapi.org

export type SunoGenerateOptions = {
  prompt?: string; // Description or lyrics (required if instrumental=false in custom mode)
  style?: string; // Music style/genre (required in custom mode)
  title?: string; // Track title (required in custom mode)
  customMode: boolean; // Enable custom mode for advanced settings
  instrumental: boolean; // Whether track should be instrumental
  personaId?: string; // Optional persona ID
  model?: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5'; // Model version
  negativeTags?: string; // Styles to exclude
  vocalGender?: 'm' | 'f'; // Vocal gender preference
  styleWeight?: number; // Style guidance weight (0.00-1.00)
  weirdnessConstraint?: number; // Creative deviation constraint (0.00-1.00)
  audioWeight?: number; // Audio influence weight (0.00-1.00)
  callBackUrl?: string; // Callback URL for completion notification
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
 * Generate music using Suno AI API
 */
export async function generateSunoMusic(options: SunoGenerateOptions): Promise<SunoGenerateResponse> {
  const apiKey = process.env.SUNO_API_KEY;

  if (!apiKey) {
    throw new Error('SUNO_API_KEY environment variable is not set');
  }

  // Validate options based on mode
  if (options.customMode) {
    if (!options.title) {
      throw new Error('Title is required in custom mode');
    }
    if (!options.style) {
      throw new Error('Style is required in custom mode');
    }
    if (!options.instrumental && !options.prompt) {
      throw new Error('Prompt is required when instrumental is false');
    }
  } else {
    if (!options.prompt) {
      throw new Error('Prompt is required in non-custom mode');
    }
  }

  try {
    console.log('[SUNO API] Request options:', JSON.stringify(options, null, 2));
    
    const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
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
      throw new Error(errorMessages[data.code] || data.msg || 'Music generation failed');
    }

    return data;
  } catch (error) {
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
  model?: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';
}): SunoGenerateOptions {
  const {
    prompt,
    title,
    instrumental = true,
    duration: _duration = 120,
    model = 'V4_5',
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
