import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { config } from './config/index.js';
import logger, { requestLogger } from './utils/logger.js';
import apiRoutes from './routes/api.js';
import mcpService from './services/mcpService.js';

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
