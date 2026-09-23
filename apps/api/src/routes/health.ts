import { Router } from 'express';
import { env } from '../config';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, version: env.VERSION, time: new Date().toISOString() });
});

export default router;