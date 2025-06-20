import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPClient } from './mcp-client';
import { JsonRpcRequest } from './types/rpc';

describe('MCPClient', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient();

    // Mock the child process
    const stdout = new (require('stream').Readable)({
      read() {} // noop
    });
    const stdin = { write: vi.fn((chunk, cb) => cb && cb()) };

    const fakeProc = {
      stdout,
      stdin,
      on: vi.fn()
    };

    // @ts-expect-error override private for test
    client['proc'] = fakeProc;
  });

  it('sends request and resolves with expected response', async () => {
    const req: JsonRpcRequest = {
      id: '123',
      method: 'ping',
      params: {},
      jsonrpc: '2.0'
    };

    // Setup: trigger the resolver manually
    const promise = client.call(req);

    const resolver = client['resolvers'].get('123');
    resolver?.({ id: '123', result: 'pong', jsonrpc: '2.0' });

    const res = await promise;
    expect(res).toEqual({ id: '123', result: 'pong', jsonrpc: '2.0' });
  });

  it('fails if process is not running', async () => {
    client['proc'] = undefined;

    const req: JsonRpcRequest = {
      id: 'fail-test',
      method: 'foo',
      params: {},
      jsonrpc: '2.0'
    };

    await expect(client.call(req)).rejects.toThrow('mcp not running');
  });

  it('rejects if stdin write fails', async () => {
    const req: JsonRpcRequest = {
      id: 'err-write',
      method: 'foo',
      params: {},
      jsonrpc: '2.0'
    };

    // simulate write failure
    // @ts-expect-error override stdin
    client['proc'].stdin.write = vi.fn((_chunk, cb) => cb(new Error('write failed')));

    await expect(client.call(req)).rejects.toThrow('write failed');
  });
});