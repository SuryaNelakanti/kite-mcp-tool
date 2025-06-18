import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { Server } from 'http';
import mcpClient from '../mcp-client.js';

interface HBWebSocket extends WebSocket { isAlive: boolean }

export default function attachWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (socket) => {
    const ws = socket as HBWebSocket;
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    const listener = (msg: any) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    };
    mcpClient.eventBus.on('notification', listener);

    ws.on('close', () => {
      mcpClient.eventBus.off('notification', listener);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      const ws = socket as HBWebSocket;
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.send(JSON.stringify({ type: 'ping' }));
    });
  }, 30_000);

  wss.on('close', () => clearInterval(interval));
}
