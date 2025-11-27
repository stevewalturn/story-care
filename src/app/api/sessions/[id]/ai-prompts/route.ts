import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { requireSessionAccess } from '@/middleware/RBACMiddleware';
import {
  moduleAiPromptsSchema,
  modulePromptLinksSchema,
  sessionsSchema,
  treatmentModulesSchema,
} from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

/**
 * GET /api/sessions/[id]/ai-prompts
 * Fetches AI prompts linked to the session's assigned treatment module
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: sessionId } = await params;
  try {
    // Verify authentication and session access
    await requireSessionAccess(request, sessionId);

    // Fetch session with module assignment
    const [session] = await db
      .select()
      .from(sessionsSchema)
      .where(eq(sessionsSchema.id, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // If no module assigned, return empty array
    if (!session.moduleId) {
      return NextResponse.json({ prompts: [] });
    }

    // Fetch module with linked AI prompts
    const [module] = await db
      .select()
      .from(treatmentModulesSchema)
      .where(eq(treatmentModulesSchema.id, session.moduleId))
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 },
      );
    }

    // Fetch linked prompts via junction table
    const linkedPrompts = await db
      .select({
        id: moduleAiPromptsSchema.id,
        name: moduleAiPromptsSchema.name,
        promptText: moduleAiPromptsSchema.promptText,
        description: moduleAiPromptsSchema.description,
        category: moduleAiPromptsSchema.category,
        icon: moduleAiPromptsSchema.icon,
        isActive: moduleAiPromptsSchema.isActive,
        sortOrder: modulePromptLinksSchema.sortOrder,
      })
      .from(modulePromptLinksSchema)
      .innerJoin(
        moduleAiPromptsSchema,
        eq(modulePromptLinksSchema.promptId, moduleAiPromptsSchema.id),
      )
      .where(eq(modulePromptLinksSchema.moduleId, module.id))
      .orderBy(modulePromptLinksSchema.sortOrder);

    // Filter only active prompts
    const activePrompts = linkedPrompts.filter(prompt => prompt.isActive);

    return NextResponse.json({
      module: {
        id: module.id,
        name: module.name,
        domain: module.domain,
        aiPromptText: module.aiPromptText,
      },
      prompts: activePrompts,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
