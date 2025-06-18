import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';
import { config } from './config/index.js';
import logger, { requestLogger } from './utils/logger.js';
import apiRoutes from './routes/api.js';
import mcpService from './services/mcpService.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: config.frontendOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Request logging
  app.use(requestLogger);
  
  // Development logging
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: { error: 'Rate limit exceeded', code: 429 },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);
  
  // Swagger configuration
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Zerodha MCP Proxy API',
        version: '1.0.0',
        description: 'API documentation for Zerodha MCP Proxy service',
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: [path.join(__dirname, 'routes/*.js')],
  };

  const specs = swaggerJsdoc(swaggerOptions);

  // API documentation route (not rate limited)
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Zerodha MCP Proxy API Docs',
    })
  );

  // API routes
  app.use('/api', apiRoutes);

  // Health check endpoint (not rate limited)
  app.get('/health', (req, res) => {
    res.status(StatusCodes.OK).json({
      status: 'ok',
      mcpAlive: mcpService.isReady,
      uptime: process.uptime(),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    logger.error({ err }, 'Unhandled error');
    
    if (res.headersSent) {
      return next(err);
    }
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });

  return app;
}

export default createApp;
