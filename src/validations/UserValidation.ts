/**
 * User Management Validation Schemas
 * Validation for inviting and managing users
 */

import { z } from 'zod';

/**
 * Schema for inviting a therapist to an organization
 */
export const inviteTherapistSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters'),
  email: z.string()
    .email('Invalid email address'),
  licenseNumber: z.string()
    .max(100, 'License number must not exceed 100 characters')
    .optional(),
  specialty: z.string()
    .max(500, 'Specialty must not exceed 500 characters')
    .optional(),
});

/**
 * Schema for creating a patient (by org admin or therapist)
 */
export const createPatientSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters'),
  email: z.string()
    .email('Invalid email address')
    .optional(),
  referenceImageUrl: z.union([
    z.string().url('Invalid image URL'),
    z.literal(''),
  ]).optional(),
  therapistId: z.string()
    .min(1, 'Therapist ID is required'),
});

/**
 * Schema for inviting a patient to the platform
 */
export const invitePatientSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters'),
  email: z.union([
    z.string().email('Invalid email address'),
    z.literal(''),
  ]).optional(),
  dateOfBirth: z.string()
    .optional(),
  referenceImageUrl: z.string().optional(),
  avatarUrl: z.string().optional(),
  therapistId: z.string()
    .min(1, 'Therapist ID is required'),
  welcomeMessage: z.string()
    .max(1000, 'Welcome message must not exceed 1000 characters')
    .optional(),
  sendInvitation: z.boolean()
    .default(true),
});

/**
 * Schema for inviting an org admin to the platform
 */
export const inviteOrgAdminSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters'),
  email: z.string()
    .email('Invalid email address'),
  organizationId: z.string()
    .min(1, 'Organization ID is required'),
});

/**
 * Schema for updating therapist details (org_admin can edit)
 */
export const updateTherapistSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters')
    .optional(),
  licenseNumber: z.string()
    .max(100, 'License number must not exceed 100 characters')
    .nullable()
    .optional(),
  specialty: z.string()
    .max(500, 'Specialty must not exceed 500 characters')
    .nullable()
    .optional(),
});

/**
 * Schema for changing therapist status
 */
export const updateTherapistStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

/**
 * Schema for approving or rejecting a pending invitation
 */
export const approveInvitationSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  rejectionReason: z.string()
    .max(1000, 'Rejection reason must not exceed 1000 characters')
    .optional(),
});

export type ApproveInvitationInput = z.infer<typeof approveInvitationSchema>;
export type InviteTherapistInput = z.infer<typeof inviteTherapistSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type InvitePatientInput = z.infer<typeof invitePatientSchema>;
export type InviteOrgAdminInput = z.infer<typeof inviteOrgAdminSchema>;
export type UpdateTherapistInput = z.infer<typeof updateTherapistSchema>;
export type UpdateTherapistStatusInput = z.infer<typeof updateTherapistStatusSchema>;
