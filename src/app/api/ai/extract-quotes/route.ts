import type { NextRequest } from 'next/server';
import type { ChatMessage, TextGenModel } from '@/libs/TextGeneration';
import { NextResponse } from 'next/server';
import { generateText } from '@/libs/TextGeneration';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { aiRateLimit, checkRateLimit, getClientIP } from '@/utils/RateLimiter';

export type ExtractedQuote = {
  quoteText: string;
  speaker: string;
  timestampSeconds?: number;
  timestampDisplay?: string;
  context?: string;
};

// POST /api/ai/extract-quotes - Extract quotes from AI message text
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`ai:${clientIP}`, aiRateLimit);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many AI requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    // Authentication
    await requireTherapist(request);

    // Validate input
    const body = await request.json();
    const { text, model = 'gemini-2.5-flash' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 },
      );
    }

    // Build extraction prompt
    const systemPrompt = `You are a precise text extraction assistant. Your task is to extract all quotes from the given text.

For each quote found, extract:
1. quoteText: The exact quote text (verbatim, including any punctuation)
2. speaker: The speaker's name (if mentioned, otherwise use "Unknown")
3. timestampDisplay: The timestamp if mentioned (format: "MM:SS" or "HH:MM:SS")
4. timestampSeconds: Convert the timestamp to total seconds (e.g., "20:45" = 1245)
5. context: Brief context about why this quote is significant (1 sentence)

IMPORTANT RULES:
- Only extract actual quotes that appear to be spoken by someone
- Look for patterns like [timestamp] - Speaker: "quote" or **[timestamp]** - **Speaker**: "quote"
- Also detect quotes in bullet points or numbered lists
- If no timestamp is mentioned, omit timestampDisplay and timestampSeconds
- If no speaker is mentioned, try to infer from context or use "Unknown"
- Return an empty array if no quotes are found

Return ONLY a valid JSON array, no other text:
[
  {
    "quoteText": "exact quote here",
    "speaker": "Speaker Name",
    "timestampDisplay": "20:45",
    "timestampSeconds": 1245,
    "context": "Brief context about significance"
  }
]`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract all quotes from the following text:\n\n${text}` },
    ];

    const result = await generateText({
      messages,
      model: model as TextGenModel,
      maxTokens: 4000,
    });

    // Parse the response as JSON
    let quotes: ExtractedQuote[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.message.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        quotes = JSON.parse(jsonMatch[0]);
      } else {
        // If no array found, try parsing the whole response
        quotes = JSON.parse(result.message);
      }

      // Validate the structure
      if (!Array.isArray(quotes)) {
        quotes = [];
      }

      // Clean up and validate each quote
      quotes = quotes
        .filter((q): q is ExtractedQuote =>
          q && typeof q.quoteText === 'string' && q.quoteText.trim().length > 0,
        )
        .map(q => ({
          quoteText: q.quoteText.trim(),
          speaker: q.speaker?.trim() || 'Unknown',
          timestampDisplay: q.timestampDisplay || undefined,
          timestampSeconds: typeof q.timestampSeconds === 'number' ? q.timestampSeconds : undefined,
          context: q.context?.trim() || undefined,
        }));
    } catch (parseError) {
      console.error('Error parsing quotes JSON:', parseError);
      console.error('Raw response:', result.message);
      // Return empty array on parse error
      quotes = [];
    }

    return NextResponse.json({
      quotes,
      model: result.model,
    });
  } catch (error) {
    console.error('Quote extraction error:', error);
    return handleAuthError(error);
  }
}
