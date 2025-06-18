import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import logger from '../utils/logger';
import { mcpService } from './mcpService';

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocketServer({ noServer: true });
    this.clients = new Map(); // clientId -> WebSocket
    this.pingInterval = null;
    this.setupServer(server);
    this.setupMCPListeners();
  }

  setupServer(server) {
    // Handle WebSocket upgrade
    server.on('upgrade', (request, socket, head) => {
      // You could add authentication here if needed
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    });

    // Handle new connections
    this.wss.on('connection', (ws, request) => {
      const clientId = uuidv4();
      this.clients.set(clientId, ws);
      logger.info(`New WebSocket connection: ${clientId}`);

      // Send initial state
      this.sendToClient(ws, {
        type: 'state',
        isMCPReady: mcpService.isReady,
      });

      // Setup ping-pong for keep-alive
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle messages from client
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleClientMessage(ws, message);
        } catch (err) {
          logger.error({ err, data: data.toString() }, 'Error parsing WebSocket message');
        }
      });

      // Handle client disconnection
      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info(`WebSocket connection closed: ${clientId}`);
      });
    });

    // Setup ping interval to check for dead connections
    this.pingInterval = setInterval(() => {
      this.checkConnections();
    }, config.ws.pingInterval);
  }

  setupMCPListeners() {
    // Forward MCP notifications to all connected clients
    mcpService.on('notification', (notification) => {
      this.broadcast({
        type: 'notification',
        ...notification,
      });
    });

    // Notify clients when MCP process state changes
    mcpService.on('ready', () => {
      this.broadcast({
        type: 'state',
        isMCPReady: true,
      });
    });
  }


  handleClientMessage(ws, message) {
    switch (message.type) {
      case 'pong':
        ws.isAlive = true;
        break;
      // Add more message types as needed
      default:
        logger.debug({ message }, 'Received unknown WebSocket message type');
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (err) {
        logger.error({ err, message }, 'Error sending WebSocket message');
      }
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(messageStr, (err) => {
          if (err) {
            logger.error({ err }, 'Error broadcasting message');
          }
        });
      }
    });
  }

  checkConnections() {
    this.clients.forEach((ws, clientId) => {
      if (ws.isAlive === false) {
        logger.info(`Terminating unresponsive WebSocket connection: ${clientId}`);
        ws.terminate();
        this.clients.delete(clientId);
        return;
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }

  close() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Close all client connections
    this.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.close(1000, 'Server shutting down');
      }
    });
    
    this.clients.clear();
    this.wss.close();
  }
}

let webSocketService = null;

export function initWebSocketService(server) {
  if (!webSocketService) {
    webSocketService = new WebSocketService(server);
  }
  return webSocketService;
}

export function getWebSocketService() {
  if (!webSocketService) {
    throw new Error('WebSocketService not initialized');
  }
  return webSocketService;
}

export default webSocketService;
