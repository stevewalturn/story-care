/**
 * Organization Service
 * Business logic for organization management
 */

import type { OrganizationSettings } from '@/types/Organization';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  organizationsSchema,
  sessions,
  users,
} from '@/models/Schema';

/**
 * Generate a unique organization join code
 * Format: WORD-WORD-YEAR (e.g., HEAL-WATERS-2025)
 */
export function generateJoinCode(): string {
  const words = [
    'CARE',
    'HEAL',
    'HOPE',
    'LIFE',
    'MIND',
    'PEACE',
    'TRUST',
    'UNITY',
    'WELLNESS',
    'HEALTH',
    'BRIGHT',
    'CLEAR',
    'SAFE',
    'STRONG',
    'VITAL',
    'WISE',
    'HEART',
    'SOUL',
    'SPIRIT',
    'BALANCE',
  ];

  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const year = new Date().getFullYear();

  return `${word1}-${word2}-${year}`;
}

/**
 * Create a new organization with an org_admin user
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  contactEmail: string;
  adminEmail: string;
  adminName: string;
  logoUrl?: string;
  primaryColor?: string;
  settings?: Partial<OrganizationSettings>;
  createdBy: string;
}) {
  console.log('OrganizationService.createOrganization - Starting with data:', data);

  try {
    // Verify the creator (super_admin) exists
    console.log('OrganizationService.createOrganization - Verifying creator user:', data.createdBy);
    const creatorUser = await db.query.users.findFirst({
      where: eq(users.id, data.createdBy),
    });

    console.log('OrganizationService.createOrganization - Creator user found:', {
      id: creatorUser?.id,
      email: creatorUser?.email,
      role: creatorUser?.role,
      organizationId: creatorUser?.organizationId,
    });

    if (!creatorUser) {
      throw new Error(`Creator user not found with ID: ${data.createdBy}`);
    }

    if (creatorUser.role !== 'super_admin') {
      throw new Error(`Only super_admin can create organizations. User role: ${creatorUser.role}`);
    }

    // Generate unique join code
    console.log('OrganizationService.createOrganization - Generating unique join code');
    let joinCode = generateJoinCode();
    let isUnique = false;

    // Ensure join code is unique
    while (!isUnique) {
      const existing = await db.query.organizations.findFirst({
        where: eq(organizationsSchema.joinCode, joinCode),
      });

      if (!existing) {
        isUnique = true;
      } else {
        joinCode = generateJoinCode();
      }
    }

    console.log('OrganizationService.createOrganization - Generated join code:', joinCode);

    // Default settings
    const defaultSettings: OrganizationSettings = {
      subscriptionTier: 'basic',
      features: {
        maxTherapists: 5,
        maxPatients: 50,
        aiCreditsPerMonth: 1000,
        storageGB: 10,
      },
      defaults: {
        reflectionQuestions: [],
        surveyTemplate: null,
        sessionTranscriptionEnabled: true,
      },
      branding: {
        welcomeMessage: null,
        supportEmail: data.contactEmail,
      },
    };

    // Merge with provided settings
    const settings = {
      ...defaultSettings,
      ...data.settings,
      features: { ...defaultSettings.features, ...data.settings?.features },
      defaults: { ...defaultSettings.defaults, ...data.settings?.defaults },
      branding: { ...defaultSettings.branding, ...data.settings?.branding },
    };

    console.log('OrganizationService.createOrganization - Prepared settings:', settings);

    // Create organization
    const organizationValues = {
      name: data.name,
      slug: data.slug,
      contactEmail: data.contactEmail,
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor || null,
      joinCode,
      joinCodeEnabled: true,
      settings,
      status: 'active' as const,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('OrganizationService.createOrganization - Inserting organization with values:', organizationValues);

    const [organization] = await db
      .insert(organizationsSchema)
      .values(organizationValues)
      .returning();

    console.log('OrganizationService.createOrganization - Organization created successfully:', {
      id: organization?.id,
      name: organization?.name,
      slug: organization?.slug,
    });

    // Create org_admin user for the new organization
    if (!organization) {
      throw new Error('Failed to create organization');
    }

    const adminUserValues = {
      email: data.adminEmail,
      name: data.adminName,
      role: 'org_admin' as const,
      organizationId: organization.id,
      status: 'invited' as const, // Invited by super admin, needs to sign in
      firebaseUid: null, // Will be set when they sign in with Firebase
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('OrganizationService.createOrganization - Inserting admin user with values:', adminUserValues);

    const adminUserResult = await db
      .insert(users)
      .values(adminUserValues)
      .returning();

    const adminUser = adminUserResult[0];

    console.log('OrganizationService.createOrganization - Admin user created successfully:', {
      id: adminUser?.id,
      email: adminUser?.email,
      role: adminUser?.role,
    });

    console.log('OrganizationService.createOrganization - Completed successfully');

    return {
      organization,
      adminUser,
    };
  } catch (error) {
    console.error('OrganizationService.createOrganization - Error occurred:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      data,
    });
    throw error;
  }
}

/**
 * Get organization by ID with metrics
 */
export async function getOrganizationWithMetrics(organizationId: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizationsSchema.id, organizationId),
  });

  if (!organization) {
    return null;
  }

  // Count therapists
  const therapistResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'therapist'),
      ),
    );
  const therapistCount = Number(therapistResult[0]?.count || 0);

  // Count active therapists
  const activeTherapistResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'therapist'),
        eq(users.status, 'active'),
      ),
    );
  const activeTherapistCount = Number(activeTherapistResult[0]?.count || 0);

  // Count patients
  const patientResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'patient'),
      ),
    );
  const patientCount = Number(patientResult[0]?.count || 0);

  // Count active patients
  const activePatientResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'patient'),
        eq(users.status, 'active'),
      ),
    );
  const activePatientCount = Number(activePatientResult[0]?.count || 0);

  // Count total sessions
  const therapists = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'therapist'),
      ),
    );

  const therapistIds = therapists.map(t => t.id);

  let totalSessions = 0;
  let sessionsLast30Days = 0;

  // Only query sessions if there are therapists in the organization
  if (therapistIds.length > 0) {
    const totalSessionsResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.therapistId, therapistIds[0]));
    totalSessions = Number(totalSessionsResult[0]?.count || 0);

    // Count sessions in last 30 days
    // TODO: Add date filter using thirtyDaysAgo
    const sessionsLast30DaysResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.therapistId, therapistIds[0]));
    sessionsLast30Days = Number(sessionsLast30DaysResult[0]?.count || 0);
  }

  // Count org admins
  const orgAdminResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'org_admin'),
      ),
    );
  const orgAdminCount = Number(orgAdminResult[0]?.count || 0);

  // Calculate total users
  const totalUsers = therapistCount + patientCount + orgAdminCount;

  // Get org admin users
  const orgAdmins = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'org_admin'),
      ),
    );

  return {
    ...organization,
    admins: orgAdmins,
    metrics: {
      totalUsers,
      totalTherapists: therapistCount,
      activeTherapists: activeTherapistCount,
      totalPatients: patientCount,
      activePatients: activePatientCount,
      totalSessions,
      sessionsLast30Days,
      storageUsedGB: 0, // TODO: Calculate from media library
      aiCreditsUsedThisMonth: 0, // TODO: Calculate from usage logs
    },
  };
}

/**
 * List all organizations (Super Admin only)
 */
export async function listOrganizations(params?: {
  status?: 'active' | 'suspended';
  page?: number;
  limit?: number;
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.status) {
    conditions.push(eq(organizationsSchema.status, params.status));
  }

  const organizationsList
    = conditions.length > 0
      ? await db
          .select()
          .from(organizationsSchema)
          .where(and(...conditions))
          .orderBy(desc(organizationsSchema.createdAt))
          .limit(limit)
          .offset(offset)
      : await db
          .select()
          .from(organizationsSchema)
          .orderBy(desc(organizationsSchema.createdAt))
          .limit(limit)
          .offset(offset);

  const totalResult = await db
    .select({ count: count() })
    .from(organizationsSchema);
  const total = Number(totalResult[0]?.count || 0);

  return {
    organizations: organizationsList,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update organization
 */
export async function updateOrganization(
  organizationId: string,
  data: Partial<{
    name: string;
    slug: string;
    contactEmail: string;
    logoUrl: string | null;
    primaryColor: string | null;
    settings: Partial<OrganizationSettings>;
    status: 'active' | 'suspended';
  }>,
) {
  const [updated] = await db
    .update(organizationsSchema)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(organizationsSchema.id, organizationId))
    .returning();

  return updated;
}

/**
 * Delete organization
 */
export async function deleteOrganization(organizationId: string) {
  const [deleted] = await db
    .delete(organizationsSchema)
    .where(eq(organizationsSchema.id, organizationId))
    .returning();

  return deleted;
}

/**
 * Verify organization join code
 */
export async function verifyJoinCode(code: string) {
  const organization = await db.query.organizations.findFirst({
    where: and(
      eq(organizationsSchema.joinCode, code),
      eq(organizationsSchema.joinCodeEnabled, true),
      eq(organizationsSchema.status, 'active'),
    ),
    columns: {
      id: true,
      name: true,
      logoUrl: true,
    },
  });

  if (!organization) {
    return {
      valid: false,
      message: 'Invalid or disabled organization code',
    };
  }

  return {
    valid: true,
    organization,
  };
}

/**
 * Regenerate organization join code
 */
export async function regenerateJoinCode(organizationId: string) {
  let joinCode = generateJoinCode();
  let isUnique = false;

  while (!isUnique) {
    const existing = await db.query.organizations.findFirst({
      where: eq(organizationsSchema.joinCode, joinCode),
    });

    if (!existing) {
      isUnique = true;
    } else {
      joinCode = generateJoinCode();
    }
  }

  const [updated] = await db
    .update(organizationsSchema)
    .set({ joinCode, updatedAt: new Date() })
    .where(eq(organizationsSchema.id, organizationId))
    .returning();

  return updated;
}

/**
 * Toggle organization join code enabled status
 */
export async function toggleJoinCode(
  organizationId: string,
  enabled: boolean,
) {
  const [updated] = await db
    .update(organizationsSchema)
    .set({ joinCodeEnabled: enabled, updatedAt: new Date() })
    .where(eq(organizationsSchema.id, organizationId))
    .returning();

  return updated;
}

/**
 * Get platform-wide metrics (Super Admin dashboard)
 */
export async function getPlatformMetrics() {
  const totalOrgsResult = await db
    .select({ count: count() })
    .from(organizationsSchema);
  const totalOrganizations = Number(totalOrgsResult[0]?.count || 0);

  const activeOrgsResult = await db
    .select({ count: count() })
    .from(organizationsSchema)
    .where(eq(organizationsSchema.status, 'active'));
  const activeOrganizations = Number(activeOrgsResult[0]?.count || 0);

  const totalTherapistsResult = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, 'therapist'));
  const totalTherapists = Number(totalTherapistsResult[0]?.count || 0);

  const totalPatientsResult = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, 'patient'));
  const totalPatients = Number(totalPatientsResult[0]?.count || 0);

  return {
    totalOrganizations,
    activeOrganizations,
    totalTherapists,
    totalPatients,
    aiCreditsUsedThisMonth: 0, // TODO: Calculate from usage logs
  };
}
