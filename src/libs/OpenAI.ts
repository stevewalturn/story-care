import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Chat completion with GPT-4
 */
export async function chat(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {},
): Promise<string> {
  const {
    model = 'gpt-4-turbo-preview',
    temperature = 0.7,
    maxTokens = 2000,
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message.content || '';
  } catch (error) {
    console.error('OpenAI chat error:', error);
    throw error;
  }
}

/**
 * Analyze transcript with therapeutic context
 */
export async function analyzeTranscript(
  text: string,
  context?: string,
): Promise<string> {
  const systemPrompt = `You are an expert therapeutic assistant specialized in narrative therapy.
Your role is to analyze therapy session transcripts and identify:
- Key therapeutic themes
- Emotional patterns
- Signs of growth or challenges
- Meaningful moments for patient reflection
- Suggestions for narrative construction

Be empathetic, professional, and focus on supporting the therapeutic process.`;

  const userPrompt = context
    ? `Context: ${context}\n\nTranscript excerpt:\n${text}\n\nPlease analyze this passage.`
    : `Transcript excerpt:\n${text}\n\nPlease analyze this passage.`;

  return chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);
}

/**
 * Extract meaningful quote from text
 */
export async function extractQuote(text: string): Promise<string> {
  const systemPrompt = `You are a therapeutic assistant helping to extract meaningful,
empowering quotes from therapy transcripts. Select quotes that:
- Show resilience, growth, or self-awareness
- Are meaningful for patient reflection
- Can stand alone as inspirational content
- Are 1-3 sentences long

Return only the quote itself, without explanation.`;

  return chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Extract the most meaningful quote from:\n\n${text}` },
  ]);
}

/**
 * Generate image prompt for DALL-E
 */
export async function generateImagePrompt(
  text: string,
  theme?: string,
): Promise<string> {
  const systemPrompt = `You are a creative assistant helping to create image generation prompts
for therapeutic narratives. Based on therapy transcript excerpts, create DALL-E prompts that:
- Capture the emotional essence and themes
- Are metaphorical and symbolic
- Are suitable for patient reflection
- Are positive and healing-oriented
- Are safe for therapeutic contexts

Return only the image prompt itself.`;

  const userPrompt = theme
    ? `Theme: ${theme}\n\nTranscript:\n${text}\n\nCreate a DALL-E image prompt.`
    : `Transcript:\n${text}\n\nCreate a DALL-E image prompt.`;

  return chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);
}

/**
 * Generate image with DALL-E
 */
export async function generateImage(
  prompt: string,
  options: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  } = {},
): Promise<string> {
  const { size = '1024x1024', quality = 'standard', style = 'natural' } = options;

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      style,
    });

    return response.data[0]?.url || '';
  } catch (error) {
    console.error('DALL-E image generation error:', error);
    throw error;
  }
}

/**
 * Generate reflection questions based on transcript
 */
export async function generateReflectionQuestions(
  text: string,
  count: number = 3,
): Promise<string[]> {
  const systemPrompt = `You are a therapeutic assistant creating reflection questions
for patients based on their therapy sessions. Questions should:
- Encourage self-reflection and growth
- Be open-ended and thought-provoking
- Connect to themes in the session
- Be accessible and non-judgmental
- Help patients explore their narrative

Return ${count} questions as a numbered list.`;

  const response = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Create reflection questions based on:\n\n${text}` },
  ]);

  // Parse numbered list
  return response
    .split('\n')
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, count);
}

export { openai };
