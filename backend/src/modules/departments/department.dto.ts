import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20).toUpperCase(),
  description: z.string().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(20).toUpperCase().optional(),
  description: z.string().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
});

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
