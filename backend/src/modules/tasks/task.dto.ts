import { z } from 'zod';
import { Priority, TaskStatus } from '../../types/enums';

export const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(3),
  departmentId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.ASSIGNED),
  estimatedHours: z.number().min(0).optional().default(0),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  slaHours: z.number().min(0.5).optional().default(24),
  tags: z.array(z.string()).default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(3).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  slaHours: z.number().min(0.5).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  actualHours: z.number().min(0).optional(),
  comment: z.string().optional(),
});

export const addTaskCommentSchema = z.object({
  content: z.string().min(1).max(3000),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusDto = z.infer<typeof updateTaskStatusSchema>;
export type AddTaskCommentDto = z.infer<typeof addTaskCommentSchema>;
