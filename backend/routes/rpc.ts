import crypto from "crypto";
import { Router } from 'express';
import { z } from 'zod';
import mcpClient from '../mcp-client.js';
import validate from '../middlewares/validate.js';
import HttpError from '../utils/http-error.js';

const router = Router();

const RpcReq = z.object({
  id: z.string().uuid().optional(),
  method: z.string().min(3),
  params: z.record(z.any()).default({}),
});

router.post('/', validate(RpcReq), async (req, res, next) => {
  const payload = RpcReq.parse(req.body);
  const id = payload.id ?? crypto.randomUUID();
  try {
    const result = await mcpClient.call(payload.method, payload.params);
    res.json(result);
  } catch (err: any) {
    if (err.code === 429) {
      next(new HttpError(429, 'rate_limited'));
    } else {
      next(err);
    }
  }
});

export default router;
