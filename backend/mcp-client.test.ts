import { MCPClient } from './mcp-client';

describe('mcp-client', () => {
  it('resolves response', async () => {
    const client: any = new MCPClient();
    const stdout = { on: jest.fn() };
    const stdin = { write: jest.fn((d: any, cb: any) => cb && cb()) };
    client['proc'] = { stdout, stdin };
    const p = client.call('test');
    const id = [...client['resolvers'].keys()][0];
    client['handleLine'](JSON.stringify({ jsonrpc: '2.0', id, result: 1 }));
    const res = await p;
    expect(res.result).toBe(1);
  });
});
