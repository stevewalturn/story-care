import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyIdToken } from '@/libs/FirebaseAdmin';

const requestSchema = z.object({
  prompt: z.string().default('Calm, therapeutic background music'),
  duration: z.number().min(30).max(300).default(180),
  style: z.enum(['calm', 'uplifting', 'contemplative', 'hopeful']).default('calm'),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyIdToken(token);

    const body = await request.json();
    const validated = requestSchema.parse(body);

    // Generate mock waveform data
    const waveformData = Array.from({ length: 100 }, (_, i) => {
      const t = i / 100;
      return Math.sin(t * Math.PI * 4) * 0.3 + 0.5 + Math.random() * 0.3;
    });

    return NextResponse.json({
      success: true,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      waveformData,
      duration: validated.duration,
      metadata: { prompt: validated.prompt, style: validated.style },
    });
  } catch (error) {
    console.error('Error generating music:', error);
    return NextResponse.json({ error: 'Failed to generate music' }, { status: 500 });
  }
}
