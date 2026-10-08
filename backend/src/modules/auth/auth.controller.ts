import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body, req.ip, req.headers['user-agent']);
      sendSuccess(res, result, 201, undefined, 'Organization and administrator registered successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body, req.ip, req.headers['user-agent']);
      sendSuccess(res, result, 200, undefined, 'Authenticated successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshTokens(refreshToken);
      sendSuccess(res, tokens, 200, undefined, 'Tokens refreshed successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken, req.user?.userId);
      sendSuccess(res, { loggedOut: true }, 200, undefined, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
}
