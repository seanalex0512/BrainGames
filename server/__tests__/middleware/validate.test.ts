import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate.js';

function makeApp(schema: Parameters<typeof validate>[0]) {
  const app = express();
  app.use(express.json());
  app.post('/test', validate(schema), (req, res) => {
    res.json({ success: true, data: req.body, error: null });
  });
  return app;
}

describe('validate middleware', () => {
  it('passes valid body through to next handler', async () => {
    const app = makeApp({
      title: { required: true, type: 'string' },
    });
    const res = await request(app).post('/test').send({ title: 'Hello' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects missing required field with 400', async () => {
    const app = makeApp({
      title: { required: true, type: 'string' },
    });
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('title');
  });

  it('rejects wrong type with 400', async () => {
    const app = makeApp({
      title: { required: true, type: 'string' },
    });
    const res = await request(app).post('/test').send({ title: 42 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('allows optional fields to be absent', async () => {
    const app = makeApp({
      title: { required: true, type: 'string' },
      description: { required: false, type: 'string' },
    });
    const res = await request(app).post('/test').send({ title: 'Hello' });
    expect(res.status).toBe(200);
  });

  it('rejects optional field with wrong type when present', async () => {
    const app = makeApp({
      title: { required: true, type: 'string' },
      description: { required: false, type: 'string' },
    });
    const res = await request(app).post('/test').send({ title: 'Hello', description: 99 });
    expect(res.status).toBe(400);
  });

  it('supports custom validator function', async () => {
    const app = makeApp({
      score: {
        required: true,
        type: 'number',
        validate: (v) => (typeof v === 'number' && v >= 0 && v <= 100 ? null : 'Must be 0-100'),
      },
    });
    const ok = await request(app).post('/test').send({ score: 50 });
    expect(ok.status).toBe(200);

    const fail = await request(app).post('/test').send({ score: 200 });
    expect(fail.status).toBe(400);
    expect(fail.body.error).toContain('Must be 0-100');
  });

  it('returns proper ApiResponse envelope on error', async () => {
    const app = makeApp({ title: { required: true, type: 'string' } });
    const res = await request(app).post('/test').send({});
    expect(res.body).toMatchObject({ success: false, data: null });
    expect(typeof res.body.error).toBe('string');
  });
});
