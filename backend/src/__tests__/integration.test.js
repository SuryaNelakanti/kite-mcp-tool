import { createServer } from 'http';
import request from 'supertest';
import WebSocket from 'ws';
import EventEmitter from 'events';
import { PassThrough } from 'stream';
import createApp from '../app.js';
import { mcpService, initWebSocketService } from '../services/index.js';
import { jest } from '@jest/globals';
import * as child from 'child_process';


function createMockProcess() {
  const proc = new EventEmitter();
  proc.stdout = new PassThrough();
  proc.stderr = new PassThrough();
  proc.stdin = new PassThrough();
  proc.kill = jest.fn(() => proc.emit('exit', 0));
  return proc;
}

describe('integration', () => {
  let server;
  let port;
  let mockProc;

  beforeAll((done) => {
    mockProc = createMockProcess();
    mcpService.setSpawn(() => mockProc);

    const app = createApp();
    server = createServer(app);
    initWebSocketService(server);
    server.listen(0, () => {
      port = server.address().port;
      mcpService.start();
      setTimeout(done, 1100); // wait for isReady
    });
  });

  afterAll((done) => {
    mcpService.stop();
    server.close(done);
  });

  test('health endpoint', async () => {
    const res = await request(`http://localhost:${port}`).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('login url caching and rpc', async () => {
    mockProc.stdin.on('data', (chunk) => {
      const msg = JSON.parse(chunk.toString());
      const id = msg.id;
      const first = !mockProc.responded;
      if (first) {
        mockProc.stdout.write(
          JSON.stringify({ jsonrpc: '2.0', id, error: { code: 401, data: { login_url: 'http://login' } } }) + '\n'
        );
        mockProc.responded = true;
      } else {
        mockProc.stdout.write(
          JSON.stringify({ jsonrpc: '2.0', id, result: { user_id: 'AB1234' } }) + '\n'
        );
        mockProc.stdout.write(
          JSON.stringify({ jsonrpc: '2.0', method: 'order_update', params: { status: 'COMPLETE' } }) + '\n'
        );
      }
    });

    const rpc1 = await request(`http://localhost:${port}`)
      .post('/api/rpc')
      .send({ jsonrpc: '2.0', id: 1, method: 'get_profile' });
    expect(rpc1.status).toBe(401);

    const loginRes = await request(`http://localhost:${port}`).get('/api/login-url');
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.login_url).toBe('http://login');

    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    const msgPromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.type === 'notification') {
          resolve(msg.method);
        }
      });
    });

    const rpc2 = await request(`http://localhost:${port}`)
      .post('/api/rpc')
      .send({ jsonrpc: '2.0', id: 2, method: 'get_profile' });
    expect(rpc2.status).toBe(200);
    expect(rpc2.body.result.user_id).toBe('AB1234');

    const notifMethod = await msgPromise;
    expect(notifMethod).toBe('order_update');
    ws.close();
  });
});
