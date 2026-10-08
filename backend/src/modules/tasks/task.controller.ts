import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { sendPaginated, sendSuccess } from '../../utils/response';

export class TaskController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.listTasks(req.user!, req.query as any);
      sendPaginated(res, result.tasks, result.page, result.limit, result.totalCount);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.getTaskById(req.user!, req.params.id);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.createTask(req.user!, req.body);
      sendSuccess(res, task, 201, undefined, 'Task created successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.updateTask(req.user!, req.params.id, req.body);
      sendSuccess(res, task, 200, undefined, 'Task updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.updateStatus(req.user!, req.params.id, req.body);
      sendSuccess(res, task, 200, undefined, 'Task status updated.');
    } catch (error) {
      next(error);
    }
  }

  public static async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comment = await TaskService.addComment(req.user!, req.params.id, req.body);
      sendSuccess(res, comment, 201, undefined, 'Comment added.');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await TaskService.deleteTask(req.user!, req.params.id);
      sendSuccess(res, { deleted: true }, 200, undefined, 'Task deleted.');
    } catch (error) {
      next(error);
    }
  }
}
