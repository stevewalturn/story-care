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
  referenceImageUrl: z.string()
    .url('Invalid image URL')
    .optional(),
  therapistId: z.string()
    .min(1, 'Therapist ID is required'),
});

export type InviteTherapistInput = z.infer<typeof inviteTherapistSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
