import express from 'express';
import request from 'supertest';
import rpcRouter from './routes/rpc';

jest.mock('./mcp-client', () => ({
  __esModule: true,
  default: { call: jest.fn().mockResolvedValue({ result: 1 }) },
}));

describe('rpc route', () => {
  const app = express();
  app.use(express.json());
  app.use('/rpc', rpcRouter);

  it('returns result', async () => {
    const res = await request(app).post('/rpc').send({ method: 'foo' });
    expect(res.body.result).toBe(1);
  });
});
