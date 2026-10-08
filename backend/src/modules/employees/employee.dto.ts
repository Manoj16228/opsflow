import { z } from 'zod';
import { EmployeeStatus } from '../../types/enums';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  designation: z.string().min(2).max(100),
  skills: z.array(z.string()).default([]),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  avatarUrl: z.string().url().optional().nullable(),
  joiningDate: z.string().datetime().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  designation: z.string().min(2).max(100).optional(),
  skills: z.array(z.string()).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
