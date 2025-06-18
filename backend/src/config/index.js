// Application configuration
export const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  
  // MCP Process
  mcp: {
    sseUrl: process.env.MCP_SSE_URL || 'https://mcp.kite.trade/sse',
    restartDelay: 5000, // 5 seconds
    requestTimeout: 5000, // 5 seconds
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // limit each IP to 300 requests per windowMs
  },
  
  // WebSocket
  ws: {
    pingInterval: 30000, // 30 seconds
  },
};

export default config;
