import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5001),
  API_PREFIX: z.string().default('/api/v1'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().default('file:./dev.db'),
  ANALYTICS_DATABASE_URL: z.string().optional(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().default('opsflow_default_jwt_secret_key_change_in_production_2026'),
  JWT_REFRESH_SECRET: z.string().default('opsflow_default_refresh_jwt_secret_key_change_in_production_2026'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  STORAGE_DRIVER: z.enum(['local', 'azure']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_STORAGE_CONTAINER_NAME: z.string().default('opsflow-attachments'),

  EMAIL_PROVIDER: z.enum(['mock', 'smtp', 'sendgrid']).default('mock'),
  EMAIL_FROM: z.string().default('notifications@opsflow.io'),
  ADMIN_ALERT_EMAIL: z.string().default('mozework11@gmail.com'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  LOG_LEVEL: z.string().default('info'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const config = parsedEnv.data;
