import { spawn as childSpawn } from 'child_process';
import { EventEmitter } from 'events';
import RingBuffer from 'ringbufferjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { rpcRequestSchema } from '../types/mcp.js';

class MCPService extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.isReady = false;
    this.pendingRequests = new Map();
    this.logs = new RingBuffer(1000);
    this.restartTimeout = null;
    this.crashTimestamps = [];
    this.spawn = childSpawn;
  }

  start() {
    if (this.process) {
      this.stop();
    }

    logger.info(`Starting MCP process with SSE URL: ${config.mcp.sseUrl}`);
    
    this.process = this.spawn('npx', ['mcp-remote', config.mcp.sseUrl], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    this.process.on('error', (err) => {
      logger.error({ err }, 'Failed to start MCP process');
      this.scheduleRestart();
    });

    this.process.on('exit', (code, signal) => {
      logger.warn({ code, signal }, 'MCP process exited');
      this.isReady = false;
      if (code !== 0) {
        this.recordCrash();
      }
      this.scheduleRestart();
    });

    // Handle stdout (JSON-RPC responses)
    this.process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach(line => this.handleMessage(line));
    });

    // Handle stderr (logs)
    this.process.stderr.on('data', (data) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        message: data.toString().trim(),
      };
      this.logs.enq(JSON.stringify(logEntry));
      logger.debug({ source: 'mcp-stderr' }, logEntry.message);
    });

    // Mark as ready after a short delay
    setTimeout(() => {
      this.isReady = true;
      logger.info('MCP process ready');
      this.emit('ready');
    }, 1000);
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.isReady = false;
    }
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
  }

  scheduleRestart() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }
    this.restartTimeout = setTimeout(() => {
      this.start();
    }, config.mcp.restartDelay);
  }

  recordCrash() {
    const now = Date.now();
    this.crashTimestamps = this.crashTimestamps.filter((t) => now - t < 60000);
    this.crashTimestamps.push(now);
    if (this.crashTimestamps.length > 5) {
      logger.error('MCP crashed too often, exiting');
      process.exit(1);
    }
  }

  setSpawn(fn) {
    this.spawn = fn;
  }

  handleMessage(message) {
    try {
      const parsed = JSON.parse(message);
      
      // Handle JSON-RPC responses
      if (parsed.id && this.pendingRequests.has(parsed.id)) {
        const { resolve, reject, timeout, method, startTime } = this.pendingRequests.get(parsed.id);
        clearTimeout(timeout);
        this.pendingRequests.delete(parsed.id);

        const duration = Date.now() - startTime;
        logger.debug({ method, duration }, 'MCP request completed');

        resolve(parsed);
      }
      // Handle notifications (no id field)
      else if (parsed.method) {
        this.emit('notification', {
          method: parsed.method,
          params: parsed.params,
        });
      }
    } catch (err) {
      logger.error({ err, message }, 'Error handling MCP message');
    }
  }

  async call(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.isReady) {
        return reject(new Error('MCP process not ready'));
      }

      const requestId = uuidv4();
      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method,
        params,
      };

      try {
        rpcRequestSchema.parse(request);
      } catch (err) {
        return reject(err);
      }

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject({ code: 504, message: 'Request timed out' });
      }, config.mcp.requestTimeout);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        method,
        startTime: Date.now(),
      });

      // Send the request to MCP process
      this.process.stdin.write(JSON.stringify(request) + '\n', (err) => {
        if (err) {
          clearTimeout(timeout);
          this.pendingRequests.delete(requestId);
          reject(err);
        }
      });
    });
  }

  getLogs(limit = 100) {
    const logs = [];
    const count = Math.min(limit, this.logs.size());
    
    for (let i = 0; i < count; i++) {
      try {
        const log = this.logs.peek(i);
        logs.push(JSON.parse(log));
      } catch (err) {
        logger.error({ err }, 'Error parsing log entry');
      }
    }
    
    return logs;
  }
}

const mcpService = new MCPService();

export default mcpService;
