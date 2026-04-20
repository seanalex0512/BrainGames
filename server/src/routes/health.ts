import { Router } from 'express';
import type { ApiResponse, HealthStatus } from '@braingames/shared';

const router = Router();

router.get('/', (_req, res) => {
  const response: ApiResponse<HealthStatus> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    },
    error: null,
  };
  res.json(response);
});

export { router as healthRouter };
