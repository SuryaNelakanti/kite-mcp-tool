import { spawn, ChildProcess } from 'child_process';
import * as readline from "node:readline";
import { Readable } from "stream";
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import logger from './utils/logger.js';
import { JsonRpcRequest, JsonRpcResponse } from './types/rpc.js';

export class MCPClient {
  private proc?: ChildProcess;
  private resolvers = new Map<string, (value: JsonRpcResponse) => void>();
  public eventBus = new EventEmitter();
  private retries: number[] = [];

  start() {
    this.spawnProcess();
  }

  private spawnProcess() {
    this.proc = spawn('npx', ['mcp-remote', 'https://mcp.kite.trade/sse'], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    const rl = readline.createInterface({ input: this.proc!.stdout as Readable });
    rl.on('line', (line) => this.handleLine(line));

    this.proc.on('exit', () => {
      this.proc = undefined;
      this.retries.push(Date.now());
      this.retries = this.retries.filter((t) => Date.now() - t < 5 * 60_000);
      if (this.retries.length <= 3) {
        logger.warn('mcp-remote exited, restarting');
        this.spawnProcess();
      } else {
        logger.error('mcp-remote exited too many times');
        process.exit(1);
      }
    });
  }

  private handleLine(line: string) {
    try {
      const msg: JsonRpcResponse & { method?: string; params?: unknown } = JSON.parse(line);
      if (msg.id && this.resolvers.has(msg.id)) {
        const resolve = this.resolvers.get(msg.id)!;
        this.resolvers.delete(msg.id);
        resolve(msg);
      } else if (msg.method) {
        this.eventBus.emit('notification', msg);
      }
    } catch (err) {
      logger.error(err);
    }
  }

  call(method: string, params: Record<string, unknown> = {}) {
    const id = uuidv4();
    const req: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };
    const payload = JSON.stringify(req) + '\n';
    return new Promise<JsonRpcResponse>((resolve, reject) => {
      if (!this.proc) return reject(new Error('mcp not running'));
      this.resolvers.set(id, resolve);
      this.proc.stdin!.write(payload, (err) => {
        if (err) {
          this.resolvers.delete(id);
          reject(err);
        }
      });
    });
  }
}

const instance = new MCPClient();
export default instance;
