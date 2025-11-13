/**
 * Generate Story Page from Module API
 * Auto-generate story page with module content
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getModuleById } from '@/services/ModuleService';
import { generateStoryPageFromModule } from '@/services/StoryPageGeneratorService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { generateStoryPageFromModuleSchema } from '@/validations/ModuleValidation';

/**
 * POST /api/modules/[id]/generate-story-page
 * Auto-generate a story page from a module-analyzed session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);

    // Only therapists and admins can generate story pages
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot generate story pages' },
        { status: 403 },
      );
    }

    // Verify module exists and is accessible
    const { module } = await getModuleById(params.id);

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check module access
    if (module.scope === 'organization' && module.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: Module not accessible' },
        { status: 403 },
      );
    }

    if (module.scope === 'private' && module.createdBy !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Module not accessible' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = generateStoryPageFromModuleSchema.parse(body);

    // Verify therapist has access to the patient
    // TODO: Add patient access check - ensure therapist is assigned to patient

    // Generate story page
    const result = await generateStoryPageFromModule({
      moduleId: params.id,
      sessionId: validated.sessionId,
      patientId: validated.patientId,
      therapistId: user.dbUserId,
      includeMedia: validated.includeMedia,
      sendNotification: validated.sendNotification,
      customTitle: validated.customTitle,
    });

    return NextResponse.json(
      {
        message: 'Story page generated successfully',
        storyPage: result.storyPage,
        blocks: result.blocks,
        emailNotification: result.emailNotification,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return handleAuthError(error);
  }
}
