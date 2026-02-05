/**
 * Generate Prompt JSON API Route
 * Uses AI to generate JSON output structure from natural language description
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PROMPT_JSON_TEMPLATES } from '@/config/PromptJSONTemplates';
import { generateText } from '@/libs/TextGeneration';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { validatePromptJSON } from '@/utils/PromptJSONValidator';
import { aiRateLimit, checkRateLimit, getClientIP } from '@/utils/RateLimiter';
import { buildTraceMetadata } from '@/utils/TraceMetadataBuilder';

// POST /api/ai/generate-prompt-json - Generate JSON structure from description
export async function POST(request: NextRequest) {
  try {
    // 1. RATE LIMITING: Prevent AI API abuse
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

    // 2. AUTHENTICATION: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 3. VALIDATE INPUT
    const body = await request.json();
    const { description, schemaType } = body;

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 },
      );
    }

    // 4. BUILD AI PROMPT WITH EXAMPLES
    const examplesText = PROMPT_JSON_TEMPLATES
      .map((template) => {
        return `## ${template.label} (schemaType: "${template.schemaType}")
${template.description}

Example:
\`\`\`json
${JSON.stringify(template.example, null, 2)}
\`\`\``;
      })
      .join('\n\n');

    const systemPrompt = `You are a JSON generator for a therapeutic AI prompt library system.

Your task is to generate valid JSON output structures for AI prompts used in narrative therapy sessions.

# Available Schema Types

${examplesText}

# Instructions

1. Read the user's description carefully
2. Choose the most appropriate schemaType based on what they're asking for
3. Generate a complete, valid JSON object following that schema type's structure
4. Include all required fields for that schema type
5. Make the content therapeutically relevant and professional
6. Return ONLY the JSON object, no explanations or markdown code blocks

# Rules

- MUST include "schemaType" field
- MUST follow the structure of one of the schema types above
- Be specific and detailed in generated content
- Use therapeutic language appropriate for narrative therapy
- Include meaningful titles, descriptions, and therapeutic context`;

    const userPrompt = schemaType
      ? `Generate a JSON structure of type "${schemaType}" for: ${description.trim()}`
      : `Generate an appropriate JSON structure for: ${description.trim()}`;

    // Build trace metadata for observability
    const traceMetadata = buildTraceMetadata({
      user,
      additionalTags: ['generate-prompt-json', 'gpt-4o-mini'],
    });

    // 5. CALL AI TO GENERATE JSON
    const aiResponse = await generateText({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'gpt-4o-mini', // Fast and cost-effective for JSON generation
      temperature: 0.7, // Balance creativity and consistency
      maxTokens: 8000, // Increased from 2000 to support larger JSON schemas
      traceMetadata,
    });

    // 6. EXTRACT AND VALIDATE JSON
    let generatedJSON: string;
    try {
      // Try to extract JSON from response (in case AI wraps it in markdown)
      const responseText = aiResponse.message;
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        generatedJSON = jsonMatch[1].trim();
      }
      else {
        generatedJSON = responseText.trim();
      }

      // Parse to validate it's valid JSON
      const parsed = JSON.parse(generatedJSON);

      // Validate structure
      const validation = validatePromptJSON(generatedJSON);

      if (!validation.isValid) {
        // AI generated invalid JSON, try to fix it or return error
        console.error('AI generated invalid JSON:', validation.errors);
        return NextResponse.json(
          {
            error: 'AI generated invalid JSON structure. Please try again or use a template.',
            details: validation.errors,
          },
          { status: 500 },
        );
      }

      // Format nicely
      const formattedJSON = JSON.stringify(parsed, null, 2);

      return NextResponse.json({
        json: formattedJSON,
        schemaType: parsed.schemaType,
        message: 'JSON generated successfully',
      });
    }
    catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI Response:', aiResponse.message);

      return NextResponse.json(
        {
          error: 'Failed to generate valid JSON. Please try again or use a template.',
          aiResponse: aiResponse.message, // Include for debugging
        },
        { status: 500 },
      );
    }
  }
  catch (error) {
    console.error('Error generating prompt JSON:', error);

    // Handle authentication errors
    const authError = handleAuthError(error);
    if (authError) {
      return authError;
    }

    return NextResponse.json(
      { error: 'Failed to generate JSON. Please try again.' },
      { status: 500 },
    );
  }
}
