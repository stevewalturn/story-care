import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { openai } from '@/libs/OpenAI';

const requestSchema = z.object({
  transcriptSelection: z.string().min(50, 'Transcript selection too short'),
  patientId: z.string().uuid(),
  patientName: z.string().optional(),
  model: z.string().default('gpt-4'),
  useReference: z.boolean().default(false),
  referenceImages: z.array(z.string()).optional(),
  sceneCount: z.number().min(1).max(5).default(3),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    try {
      await verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 },
      );
    }

    // Validate request body
    const body = await request.json();
    const validated = requestSchema.parse(body);

    // Generate therapeutic scene cards using OpenAI
    const systemPrompt = `You are a narrative therapy assistant helping therapists create therapeutic scene cards from session transcripts.

Your task is to analyze the provided transcript and generate ${validated.sceneCount} therapeutic scene cards that:
1. Identify key moments where the patient expressed struggle, growth, or insight
2. Extract meaningful quotes that anchor each scene
3. Explain the therapeutic significance of each moment
4. Create vivid, emotionally resonant image prompts for visualization
5. Describe how to animate these images into therapeutic scenes

Output a JSON object with this structure:
{
  "type": "therapeutic_scene_card",
  "title": "Therapeutic Scene Card",
  "subtitle": "References images & animation",
  "patient": "${validated.patientName || 'Patient'}",
  "scenes": [
    {
      "sceneNumber": 1,
      "sections": {
        "patientQuote": {
          "label": "Patient Quote Anchor",
          "content": "Direct quote from transcript"
        },
        "meaning": {
          "label": "Meaning",
          "content": "Therapeutic significance explanation"
        },
        "imagePrompt": {
          "label": "Image prompt",
          "content": "Detailed visual description for AI generation"
        },
        "imageToScene": {
          "label": "Image to scene",
          "content": "How to animate this into a therapeutic video scene"
        }
      }
    }
  ],
  "status": "completed"
}`;

    const userPrompt = `Analyze this therapy session transcript and generate ${validated.sceneCount} therapeutic scene cards:

${validated.transcriptSelection}

Focus on moments of:
- Emotional expression and vulnerability
- Insight or realization
- Struggle or challenge
- Growth or progress
- Meaningful metaphors

Create vivid, cinematic image prompts that would be therapeutic for the patient to see.`;

    const completion = await openai.chat.completions.create({
      model: validated.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    const sceneData = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      sceneCard: sceneData,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error('Error generating scenes:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate scenes' },
      { status: 500 },
    );
  }
}
