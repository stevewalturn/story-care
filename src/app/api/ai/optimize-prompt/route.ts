import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { openai } from '@/libs/OpenAI';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

const requestSchema = z.object({
  prompt: z.string().min(10),
  model: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini']).default('gpt-4o-mini'),
  context: z.string().optional(),
  optimizeFor: z.enum(['image', 'video', 'both']).default('both'),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication & authorization
    await requireTherapist(request);

    // Validate request body
    const body = await request.json();
    const validated = requestSchema.parse(body);

    const systemPrompt = `You are an expert prompt engineer specializing in therapeutic image and video generation.

Your task is to optimize image/video prompts for therapeutic scenes. The optimized prompts should:
1. Add cinematic and artistic details (lighting, composition, color palette)
2. Enhance emotional resonance and therapeutic value
3. Be specific and detailed enough for AI image generation
4. Maintain the core therapeutic meaning
5. Include camera angles, depth of field, and mood descriptors
6. Be appropriate for a therapeutic context (avoid harsh or disturbing elements)

${validated.optimizeFor === 'video' ? 'Focus on dynamic elements, movement, and animation potential.' : ''}
${validated.optimizeFor === 'image' ? 'Focus on static composition, symbolism, and visual impact.' : ''}

Return ONLY the optimized prompt text, no explanations or meta-commentary.`;

    let userPrompt = `Optimize this prompt for therapeutic ${validated.optimizeFor} generation:\n\n${validated.prompt}`;

    if (validated.context) {
      userPrompt += `\n\nTherapeutic context: ${validated.context}`;
    }

    const completion = await openai.chat.completions.create({
      model: validated.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const optimizedPrompt = completion.choices[0]?.message.content?.trim();
    if (!optimizedPrompt) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({
      success: true,
      originalPrompt: validated.prompt,
      optimizedPrompt,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error('Error optimizing prompt:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 },
      );
    }

    return handleAuthError(error);
  }
}
