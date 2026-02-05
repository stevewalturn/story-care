import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateText } from '@/libs/TextGeneration';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { buildTraceMetadata } from '@/utils/TraceMetadataBuilder';

/**
 * POST /api/ai/suggest-music-options
 * Generate music suggestions based on scene prompts
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const user = await requireTherapist(request);

    const body = await request.json();
    const { scenePrompts, patientName } = body;

    if (!scenePrompts || scenePrompts.length === 0) {
      return NextResponse.json(
        { error: 'Scene prompts are required' },
        { status: 400 },
      );
    }

    // Build context from scene prompts
    const promptContext = Array.isArray(scenePrompts)
      ? scenePrompts.join('\n')
      : scenePrompts;

    // Generate music suggestions using AI
    const systemPrompt = `You are a therapeutic music director specializing in creating healing soundtracks for narrative therapy sessions.
Your task is to analyze scene descriptions and suggest appropriate background music that enhances the therapeutic narrative.

Respond ONLY with valid JSON in this exact format:
{
  "instrumental": {
    "title": "A descriptive title for the instrumental track",
    "genre_tags": ["tag1", "tag2", "tag3"],
    "mood": "Description of the emotional mood",
    "music_description": "Detailed description of the musical elements",
    "style_prompt": "Specific style instructions for music generation"
  },
  "lyrical": {
    "title": "A descriptive title for the song with lyrics",
    "genre_tags": ["tag1", "tag2", "tag3"],
    "mood": "Description of the emotional mood",
    "music_description": "Detailed description of the musical elements",
    "style_prompt": "Specific style instructions for music generation",
    "suggested_lyrics": "Sample lyrics that match the narrative (2-4 lines)"
  }
}`;

    const userPrompt = `Based on the following therapeutic scene descriptions${patientName ? ` for ${patientName}` : ''}, suggest appropriate background music options:

Scene Descriptions:
${promptContext}

Create both an instrumental option (calming, therapeutic background music) and a lyrical option (song with meaningful lyrics) that would complement these scenes. Consider the emotional journey, key themes, and therapeutic goals implied by the scenes.`;

    // Build trace metadata for observability
    const traceMetadata = buildTraceMetadata({
      user,
      additionalTags: ['suggest-music-options', 'gpt-4o-mini'],
    });

    const response = await generateText({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 1000,
      traceMetadata,
    });

    // Parse JSON response
    let options;
    try {
      // Extract JSON from the response (handle markdown code blocks if present)
      let jsonStr = response.message;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1] || jsonStr;
      }
      options = JSON.parse(jsonStr.trim());
    } catch {
      console.error('[API /api/ai/suggest-music-options] Failed to parse AI response:', response.message);
      // Return default options if parsing fails
      options = {
        instrumental: {
          title: 'Therapeutic Journey',
          genre_tags: ['ambient', 'therapeutic', 'calming'],
          mood: 'Peaceful and reflective',
          music_description: 'Gentle background music with soft piano and ambient sounds',
          style_prompt: 'calm therapeutic background music with gentle piano and ambient sounds',
        },
        lyrical: {
          title: 'Story of Healing',
          genre_tags: ['therapeutic', 'healing', 'narrative'],
          mood: 'Hopeful and encouraging',
          music_description: 'A therapeutic song with meaningful lyrics',
          style_prompt: 'therapeutic song with meaningful lyrics about healing and growth',
          suggested_lyrics: 'Gentle verses about hope, healing, and personal growth',
        },
      };
    }

    console.log('[API /api/ai/suggest-music-options] Generated music options:', {
      instrumentalTitle: options.instrumental?.title,
      lyricalTitle: options.lyrical?.title,
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error('[API /api/ai/suggest-music-options] Error:', error);
    return handleAuthError(error);
  }
}
