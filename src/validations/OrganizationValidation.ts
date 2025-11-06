/**
 * Organization Validation Schemas
 * Zod schemas for validating organization-related API requests
 */

import { z } from 'zod';

/**
 * Organization status enum
 */
export const organizationStatusSchema = z.enum(['active', 'suspended']);

/**
 * Subscription tier enum
 */
export const subscriptionTierSchema = z.enum([
  'free',
  'basic',
  'professional',
  'enterprise',
]);

/**
 * Organization settings schema
 */
export const organizationSettingsSchema = z.object({
  subscriptionTier: subscriptionTierSchema,
  features: z.object({
    maxTherapists: z.number().nullable(),
    maxPatients: z.number().nullable(),
    aiCreditsPerMonth: z.number(),
    storageGB: z.number(),
  }),
  defaults: z.object({
    reflectionQuestions: z.array(z.string()),
    surveyTemplate: z.string().nullable(),
    sessionTranscriptionEnabled: z.boolean(),
  }),
  branding: z.object({
    welcomeMessage: z.string().nullable(),
    supportEmail: z.string().email().nullable(),
  }),
});

/**
 * Create organization request schema
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  contactEmail: z.string().email(),
  adminEmail: z.string().email(),
  adminName: z.string().min(2).max(255),
  logoUrl: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color')
    .optional(),
  settings: organizationSettingsSchema.optional(),
});

/**
 * Update organization request schema
 */
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  contactEmail: z.string().email().optional(),
  adminEmail: z.string().email().optional(),
  adminName: z.string().min(2).max(255).optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color')
    .nullable()
    .optional(),
  settings: organizationSettingsSchema.partial().optional(),
  status: organizationStatusSchema.optional(),
});

/**
 * Verify organization code request schema
 */
export const verifyOrgCodeSchema = z.object({
  code: z.string().min(1).max(50),
});

/**
 * Regenerate join code request schema
 */
export const regenerateJoinCodeSchema = z.object({
  organizationId: z.string().uuid(),
});

/**
 * Toggle join code request schema
 */
export const toggleJoinCodeSchema = z.object({
  organizationId: z.string().uuid(),
  enabled: z.boolean(),
});

/**
 * User approval request schema
 */
export const approveUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['therapist', 'patient']),
  licenseNumber: z.string().optional(),
  specialty: z.string().optional(),
});

/**
 * User role change request schema (Super Admin only)
 */
export const changeUserRoleSchema = z.object({
  userId: z.string().uuid(),
  newRole: z.enum(['org_admin', 'therapist', 'patient']),
  reason: z.string().min(10).max(500),
});

/**
 * Reject user request schema
 */
export const rejectUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10).max(500),
});
