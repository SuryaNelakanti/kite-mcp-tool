import { createServer } from 'http';
import { config } from './config/index.js';
import { mcpService, initWebSocketService } from './services/index.js';
import createApp from './app.js';
import logger from './utils/logger.js';

// Create Express app
const app = createApp();

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
initWebSocketService(server); 

// Start MCP service
mcpService.start();

// Handle shutdown gracefully
function shutdown(signal) {
  return () => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    
    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        logger.error({ err }, 'Error closing HTTP server');
      } else {
        logger.info('HTTP server closed');
      }
      
      // Stop MCP service
      mcpService.stop();
      
      // Exit the process
      process.exit(0);
    });
    
    // Force exit after 5 seconds if cleanup takes too long
    setTimeout(() => {
      logger.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 5000);
  };
}

// Handle termination signals
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  // Don't exit immediately, let the server handle it
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
  // Don't exit immediately, let the server handle it
});

// Start the server
server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  logger.info(`CORS enabled for origin: ${config.frontendOrigin}`);
});

export default server;
