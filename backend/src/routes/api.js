import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import mcpService from '../services/mcpService.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the service and MCP process
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 mcpAlive:
 *                   type: boolean
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 */
router.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'ok',
    mcpAlive: mcpService.isReady,
    uptime: process.uptime(),
  });
});

/**
 * @openapi
 * /login-url:
 *   get:
 *     summary: Get login URL
 *     description: Returns the URL for user authentication
 *     responses:
 *       200:
 *         description: Login URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 login_url:
 *                   type: string
 *                   example: https://kite.zerodha.com/connect/login?api_key=your_api_key
 */
router.get('/login-url', (req, res) => {
  // In a real implementation, this would come from MCP's 401 response
  res.status(StatusCodes.OK).json({
    login_url: 'https://kite.zerodha.com/connect/login?api_key=your_api_key&request_token=your_request_token',
  });
});

/**
 * @openapi
 * /rpc:
 *   post:
 *     summary: JSON-RPC endpoint
 *     description: Proxy requests to the MCP service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method]
 *             properties:
 *               method:
 *                 type: string
 *                 description: RPC method name
 *               params:
 *                 type: object
 *                 description: Method parameters
 *     responses:
 *       200:
 *         description: RPC response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RPCResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Authentication required
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/rpc', async (req, res) => {
  const { method, params = {} } = req.body;
  logger.info(req, 'request');
  logger.info(req.body, 'request body');
  const requestId = req.body.id || uuidv4();

  if (!method) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32600, message: 'Invalid Request' },
    });
  }

  try {
    logger.debug({ method, params }, 'RPC request');
    const result = await mcpService.call(method, params);
    
    res.json({
      jsonrpc: '2.0',
      id: requestId,
      result,
    });
  } catch (error) {
    logger.error({ err: error, method }, 'RPC error');
    
    // Handle login URL response
    if (error.code === 401 && error.data?.login_url) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: 401,
          message: 'Authentication required',
          data: { login_url: error.data.login_url },
        },
      });
    }

    // Handle rate limiting
    if (error.code === 429) {
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: 429,
          message: 'Rate limit exceeded',
          retry_after: error.retry_after,
        },
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: error.code || -32603,
        message: error.message || 'Internal server error',
      },
    });
  }
});

/**
 * @openapi
 * /logs:
 *   get:
 *     summary: Get MCP logs
 *     description: Returns recent logs from the MCP process
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of log entries to return
 *     responses:
 *       200:
 *         description: Log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                   message:
 *                     type: string
 */
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  const logs = mcpService.getLogs(limit);
  res.json(logs);
});

export default router;
