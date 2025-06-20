import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import promClient from 'prom-client';
import env from './env.js';
import mcpClient from './mcp-client.js';
import rpcRouter from './routes/rpc.js';
import chatRouter from './routes/chat.js';
import attachWebSocket from './routes/ws.js';
import errorHandler from './middlewares/error.js';
import logger from './utils/logger.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());


app.get('/health', (_req, res) => {
  res.json({ uptime: process.uptime() });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.use('/rpc', rpcRouter);
app.use('/chat', chatRouter);
app.use(errorHandler);

const server = http.createServer(app);
attachWebSocket(server);

server.listen(env.PORT, () => {
  logger.info(`listening on ${env.PORT}`);
  mcpClient.start();
});
