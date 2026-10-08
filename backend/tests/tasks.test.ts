import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';

describe('Tasks API & SLA Suite', () => {
  const app = createApp();

  const token = jwt.sign(
    {
      userId: 'test-user-id',
      email: 'admin@test.com',
      role: 'ADMIN',
      organizationId: 'test-org-id',
    },
    'test_secret_access_key_12345'
  );

  it('GET /api/v1/tasks should reject requests missing Authorization Bearer token', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
