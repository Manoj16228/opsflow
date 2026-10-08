import { Response } from 'express';

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  message?: string;
}

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, any>,
  message?: string
): Response {
  const payload: StandardResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
    ...(message && { message }),
  };
  return res.status(statusCode).json(payload);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  totalCount: number,
  extraMeta?: Record<string, any>
): Response {
  const totalPages = Math.ceil(totalCount / limit);
  return res.status(200).json({
    success: true,
    data: items,
    meta: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      ...extraMeta,
    },
  });
}
