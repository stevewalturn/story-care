import { z } from 'zod';

export const createTrialPatientSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(127),
  lastName: z.string().min(1).max(127),
});

export type CreateTrialPatientInput = z.infer<typeof createTrialPatientSchema>;
