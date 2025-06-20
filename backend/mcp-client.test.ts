import { describe, it, expect, vi } from 'vitest';
import { MCPClient } from './mcp-client';

describe('mcp-client', () => {
  it('resolves response', async () => {
    const client: any = new MCPClient();

    const stdout = { on: vi.fn() };
    const stdin = { write: vi.fn((d: any, cb: any) => cb && cb()) };

    // Inject mock process
    client['proc'] = { stdout, stdin };

    const req = {
      jsonrpc: '2.0',
      id: '1',
      method: 'test',
      params: {},
    };

    // Initiate the call
    const promise = client.call(req);

    // Manually simulate receiving a line from stdout
    client['handleLine'](
      JSON.stringify({ jsonrpc: '2.0', id: '1', result: 1 })
    );

    const res = await promise;
    expect(res.result).toBe(1);
  });
});