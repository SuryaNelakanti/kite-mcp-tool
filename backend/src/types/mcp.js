import { z } from 'zod';

export const rpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.string(),
  method: z.string(),
  params: z.record(z.any()).optional(),
});
