import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { ApiResponse, HealthStatus } from '@braingames/shared';

describe('GET /api/health', () => {
  const { app } = createApp();

  it('returns 200 with correct envelope shape', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject<ApiResponse<HealthStatus>>({
      success: true,
      data: {
        status: 'ok',
        version: '0.1.0',
        timestamp: expect.any(String) as string,
      },
      error: null,
    });
  });

  it('returns a valid ISO timestamp', async () => {
    const res = await request(app).get('/api/health');
    const timestamp = (res.body as ApiResponse<HealthStatus>).data?.timestamp;

    expect(timestamp).toBeDefined();
    expect(new Date(timestamp!).toISOString()).toBe(timestamp);
  });
});
