import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';

// Mock prisma client for unit/integration tests
jest.mock('../src/database/prisma', () => {
  return {
    prisma: {
      $connect: jest.fn().mockResolvedValue(true),
      $disconnect: jest.fn().mockResolvedValue(true),
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      department: {
        create: jest.fn(),
      },
      employee: {
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(),
    },
  };
});

describe('Authentication API Suite', () => {
  const app = createApp();

  it('GET /api/v1/health should return system status 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('OpsFlow Core API');
  });

  it('POST /api/v1/auth/login should reject empty credentials with 422', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
