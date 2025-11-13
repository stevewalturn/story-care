/**
 * Treatment Module Detail API
 * Get, update, and delete specific module
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  archiveModule,
  getModuleById,
  updateModule,
} from '@/services/ModuleService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { updateModuleSchema } from '@/validations/ModuleValidation';

/**
 * GET /api/modules/[id] - Get module with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await requireAuth(request);

    const moduleData = await getModuleById(id);

    if (!moduleData.module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check access permissions
    const { module } = moduleData;

    // System modules: accessible to all
    if (module.scope === 'system') {
      return NextResponse.json(moduleData);
    }

    // Organization modules: accessible to org members
    if (module.scope === 'organization') {
      if (module.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Module not accessible' },
          { status: 403 },
        );
      }
      return NextResponse.json(moduleData);
    }

    // Private modules: accessible only to creator
    if (module.scope === 'private') {
      if (module.createdBy !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: Module not accessible' },
          { status: 403 },
        );
      }
      return NextResponse.json(moduleData);
    }

    return NextResponse.json(moduleData);
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PUT /api/modules/[id] - Update module
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await requireAuth(request);

    // Get existing module to check permissions
    const { module: existingModule } = await getModuleById(id);

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Authorization checks
    // System modules: only super admins can update
    if (existingModule.scope === 'system' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can update system modules' },
        { status: 403 },
      );
    }

    // Organization modules: only org admins and super admins
    if (
      existingModule.scope === 'organization'
      && !['super_admin', 'org_admin'].includes(user.role)
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can update organization modules' },
        { status: 403 },
      );
    }

    // Private modules: only creator can update
    if (
      existingModule.scope === 'private'
      && existingModule.createdBy !== user.dbUserId
    ) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own modules' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = updateModuleSchema.parse(body);

    const updatedModule = await updateModule(id, validated);

    return NextResponse.json({ module: updatedModule });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/modules/[id] - Archive module (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await requireAuth(request);

    // Get existing module to check permissions
    const { module: existingModule } = await getModuleById(id);

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Authorization checks (same as update)
    if (existingModule.scope === 'system' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can archive system modules' },
        { status: 403 },
      );
    }

    if (
      existingModule.scope === 'organization'
      && !['super_admin', 'org_admin'].includes(user.role)
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can archive organization modules' },
        { status: 403 },
      );
    }

    if (
      existingModule.scope === 'private'
      && existingModule.createdBy !== user.dbUserId
    ) {
      return NextResponse.json(
        { error: 'Forbidden: You can only archive your own modules' },
        { status: 403 },
      );
    }

    const archivedModule = await archiveModule(id);

    return NextResponse.json({
      message: 'Module archived successfully',
      module: archivedModule,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
