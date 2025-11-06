/**
 * Organization Service
 * Business logic for organization management
 */

import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  organizationsSchema,
  users,
  sessions,
} from '@/models/Schema';
import type { OrganizationSettings } from '@/types/Organization';

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
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  contactEmail: string;
  logoUrl?: string;
  primaryColor?: string;
  settings?: Partial<OrganizationSettings>;
  trialEndsAt?: Date;
  createdBy: string;
}) {
  // Generate unique join code
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

  // Default settings
  const defaultSettings: OrganizationSettings = {
    subscriptionTier: 'trial',
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

  // Calculate trial end date (30 days from now if not provided)
  const trialEndsAt =
    data.trialEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Create organization
  const [organization] = await db
    .insert(organizationsSchema)
    .values({
      name: data.name,
      slug: data.slug,
      contactEmail: data.contactEmail,
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor || null,
      joinCode,
      joinCodeEnabled: true,
      settings,
      status: 'trial',
      trialEndsAt,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return organization;
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

  const therapistIds = therapists.map((t) => t.id);

  const totalSessionsResult = await db
    .select({ count: count() })
    .from(sessions)
    .where(
      therapistIds.length > 0
        ? and(
            eq(sessions.therapistId, therapistIds[0]),
            // TODO: Add OR condition for other therapists
          )
        : eq(sessions.id, ''), // No sessions if no therapists
    );
  const totalSessions = Number(totalSessionsResult[0]?.count || 0);

  // Count sessions in last 30 days
  // TODO: Add date filter using thirtyDaysAgo
  const sessionsLast30DaysResult = await db
    .select({ count: count() })
    .from(sessions)
    .where(
      therapistIds.length > 0
        ? and(
            eq(sessions.therapistId, therapistIds[0]),
            // TODO: Add date filter and OR condition
          )
        : eq(sessions.id, ''),
    );
  const sessionsLast30Days = Number(sessionsLast30DaysResult[0]?.count || 0);

  return {
    ...organization,
    metrics: {
      therapistCount,
      activeTherapistCount,
      patientCount,
      activePatientCount,
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
  status?: 'active' | 'trial' | 'suspended';
  page?: number;
  limit?: number;
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params?.status) {
    conditions.push(eq(organizationsSchema.status, params.status));
  }

  const organizationsList =
    conditions.length > 0
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
    status: 'active' | 'trial' | 'suspended';
    trialEndsAt: Date | null;
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
