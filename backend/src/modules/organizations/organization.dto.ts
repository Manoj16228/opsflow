import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  settings: z.record(z.any()).optional(),
});

export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
