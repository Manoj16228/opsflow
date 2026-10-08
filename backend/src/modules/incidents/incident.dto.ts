import { z } from 'zod';
import { IncidentSeverity, IncidentStatus } from '../../types/enums';

export const createIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5),
  severity: z.nativeEnum(IncidentSeverity).default(IncidentSeverity.MEDIUM),
  departmentId: z.string().uuid().optional().nullable(),
  assignedEmployeeId: z.string().uuid().optional().nullable(),
  slaHours: z.number().min(0.5).optional(),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(5).optional(),
  severity: z.nativeEnum(IncidentSeverity).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  assignedEmployeeId: z.string().uuid().optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
});

export const updateIncidentStatusSchema = z.object({
  status: z.nativeEnum(IncidentStatus),
  resolutionNotes: z.string().optional(),
});

export const addIncidentCommentSchema = z.object({
  content: z.string().min(1).max(3000),
});

export type CreateIncidentDto = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentDto = z.infer<typeof updateIncidentSchema>;
export type UpdateIncidentStatusDto = z.infer<typeof updateIncidentStatusSchema>;
export type AddIncidentCommentDto = z.infer<typeof addIncidentCommentSchema>;
