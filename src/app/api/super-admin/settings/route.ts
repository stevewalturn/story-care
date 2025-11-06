/**
 * Super Admin Platform Settings API
 * Manage platform-wide configuration
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  handleRBACError,
  requireSuperAdmin,
} from '@/middleware/RBACMiddleware';
import { platformSettingsSchema } from '@/models/Schema';

/**
 * GET /api/super-admin/settings - Get platform settings
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Get the first (and only) settings record
    const settings = await db
      .select()
      .from(platformSettingsSchema)
      .limit(1);

    // If no settings exist, return defaults
    if (!settings || settings.length === 0) {
      return NextResponse.json({
        settings: {
          platformName: 'StoryCare',
          supportEmail: '',
          defaultTrialDuration: 30,
          defaultAiCredits: 1000,
          imageGenModel: 'dall-e-3',
          defaultStorageQuota: 10737418240, // 10GB
          maxFileUploadSize: 524288000, // 500MB
          requireEmailVerification: true,
          enableMfaForAdmins: true,
          sessionTimeout: 15,
        },
      });
    }

    return NextResponse.json({ settings: settings[0] });
  } catch (error) {
    return handleRBACError(error);
  }
}

/**
 * PUT /api/super-admin/settings - Update platform settings
 */
export async function PUT(request: NextRequest) {
  try {
    const decodedToken = await requireSuperAdmin(request);
    const body = await request.json();

    // Check if settings record exists
    const existingSettings = await db
      .select()
      .from(platformSettingsSchema)
      .limit(1);

    let updatedSettings;

    if (!existingSettings || existingSettings.length === 0) {
      // Create new settings record
      [updatedSettings] = await db
        .insert(platformSettingsSchema)
        .values({
          supportEmail: body.supportEmail,
          defaultAiCredits: body.defaultAiCredits,
          imageGenModel: body.imageGenModel,
          defaultStorageQuota: body.defaultStorageQuota,
          maxFileUploadSize: body.maxFileUploadSize,
          requireEmailVerification: body.requireEmailVerification,
          enableMfaForAdmins: body.enableMfaForAdmins,
          sessionTimeout: body.sessionTimeout,
          updatedBy: decodedToken.dbUserId,
          updatedAt: new Date(),
        })
        .returning();
    } else {
      // Update existing settings record
      [updatedSettings] = await db
        .update(platformSettingsSchema)
        .set({
          supportEmail: body.supportEmail,
          defaultAiCredits: body.defaultAiCredits,
          imageGenModel: body.imageGenModel,
          defaultStorageQuota: body.defaultStorageQuota,
          maxFileUploadSize: body.maxFileUploadSize,
          requireEmailVerification: body.requireEmailVerification,
          enableMfaForAdmins: body.enableMfaForAdmins,
          sessionTimeout: body.sessionTimeout,
          updatedBy: decodedToken.dbUserId,
          updatedAt: new Date(),
        })
        .where(eq(platformSettingsSchema.id, existingSettings[0]!.id))
        .returning();
    }

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    return handleRBACError(error);
  }
}
