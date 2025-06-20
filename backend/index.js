const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// Configuration
const PORT = process.env.PORT || 3001;
// const MCP_SSE_URL = process.env.MCP_SSE_URL || 'https://mcp.kite.trade/sse';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// Rate limiting - 300 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  message: { error: 'Rate limit exceeded', code: 429 }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// WebSocket server for MCP notifications
const wss = new WebSocket.Server({ noServer: true });

// Track connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.on('message', (message) => {
    // Handle pong messages for keep-alive
    try {
      const data = JSON.parse(message);
      if (data.type === 'pong') {
        ws.isAlive = true;
      }
    } catch (e) {
      console.error('Error parsing WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  // Send ping every 30 seconds
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(pingInterval);
  });
});

// RPC endpoint
app.post('/rpc', apiLimiter, async (req, res) => {
  const { method, params = {} } = req.body;
  const requestId = req.body.id || uuidv4();

  try {
    // Here we would forward the request to the MCP service
    // For now, we'll simulate a response
    const response = await forwardToMCP(method, params);
    
    // Handle login URL response
    if (response?.error?.code === 401 && response?.data?.login_url) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: 401,
          message: 'Authentication required',
          data: {
            login_url: response.data.login_url
          }
        }
      });
    }

    res.json({
      jsonrpc: '2.0',
      id: requestId,
      result: response
    });
  } catch (error) {
    console.error('RPC Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: error.code || -32603,
        message: error.message || 'Internal server error'
      }
    });
  }
});

// Simulate MCP forwarding
async function forwardToMCP(method, _) {
  // In a real implementation, this would forward to the MCP service
  // For now, we'll simulate some responses
  if (method === 'get_profile') {
    return {
      user_id: 'XX0000',
      user_name: 'Test User',
      email: 'test@example.com',
      // ... other profile fields
    };
  }
  
  if (method === 'get_holdings') {
    return [];
  }
  
  if (method === 'get_positions') {
    return { net: [], day: [] };
  }
  
  // Simulate login URL response for unauthorized requests
  if (!process.env.ACCESS_TOKEN) {
    return {
      error: {
        code: 401,
        message: 'Authentication required',
        data: {
          login_url: 'https://kite.zerodha.com/connect/login?api_key=your_api_key&request_token=your_request_token'
        }
      }
    };
  }
  
  return { success: true };
}

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    wss.close(() => {
      console.log('WebSocket server closed.');
      process.exit(0);
    });
  });
});

module.exports = { app, server, wss };
