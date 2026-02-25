/**
 * Assign Module to Session API
 * Link a treatment module to a therapy session
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { handleRBACError, requireWritableSession } from '@/middleware/RBACMiddleware';
import { getModuleById } from '@/services/ModuleService';
import { assignModuleToSession } from '@/services/SessionService';
import { handleAuthError } from '@/utils/AuthHelpers';
import { assignModuleToSessionSchema } from '@/validations/ModuleValidation';

/**
 * POST /api/sessions/[id]/assign-module
 * Assign a module to a session for targeted analysis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireWritableSession(request, id);

    const body = await request.json();
    const validated = assignModuleToSessionSchema.parse(body);

    // Verify module exists and is accessible
    const { module: assignedModule } = await getModuleById(validated.moduleId);

    if (!assignedModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check module access
    if (assignedModule.scope === 'organization' && assignedModule.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: Module not accessible' },
        { status: 403 },
      );
    }

    if (assignedModule.scope === 'private' && assignedModule.createdBy !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Module not accessible' },
        { status: 403 },
      );
    }

    // TODO: Verify therapist has access to the session
    // Ensure session belongs to therapist or their organization

    // Assign module to session
    const sessionModule = await assignModuleToSession({
      sessionId: id,
      moduleId: validated.moduleId,
      assignedBy: user.dbUserId,
      notes: validated.notes,
    });

    return NextResponse.json(
      {
        message: 'Module assigned to session successfully',
        sessionModule,
        module: assignedModule,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error assigning module to session:', error);
    if (error instanceof Error && (error.message.includes('Forbidden') || error.message.includes('not found'))) {
      return handleRBACError(error);
    }
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
