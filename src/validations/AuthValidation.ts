/**
 * Authentication Validation Schemas
 * Zod schemas for user signup and authentication
 */

import { z } from 'zod';

/**
 * Self-signup request schema
 */
export const selfSignupSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  organizationCode: z.string().min(1).max(50),
  role: z.enum(['therapist', 'patient']),
  licenseNumber: z.string().optional(),
  specialty: z.string().optional(),
});

/**
 * Complete registration schema (after Firebase auth)
 */
export const completeRegistrationSchema = z.object({
  firebaseUid: z.string().min(1),
  name: z.string().min(2).max(255),
  email: z.string().email(),
  organizationId: z.string().uuid(),
  role: z.enum(['therapist', 'patient']),
  licenseNumber: z.string().optional(),
  specialty: z.string().optional(),
});
