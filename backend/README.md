# Zerodha MCP Web Dashboard - Backend

This is the backend service for the Zerodha MCP Web Dashboard. It acts as a proxy between the frontend and the Zerodha MCP service, providing a REST API and WebSocket interface.

## Features

- JSON-RPC over stdio communication with MCP process
- WebSocket server for real-time notifications
- Rate limiting and request validation
- Health check endpoints
- Logging and error handling
- Graceful shutdown

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- Access to Zerodha MCP service

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file in the project root with the following variables:

```env
# Server
PORT=3001
NODE_ENV=development

# MCP
MCP_SSE_URL=https://mcp.kite.trade/sse

# Frontend
FRONTEND_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## Development

To run the server in development mode with auto-reload:

```bash
npm run dev
```

## Production

To run the server in production mode:

```bash
npm start
```

## API Documentation

The API is documented using OpenAPI (Swagger). When the server is running, you can access the API documentation at:

- Swagger UI: `http://localhost:3001/api-docs`
- OpenAPI JSON: `http://localhost:3001/api-docs.json`

## Endpoints

### `GET /health`

Check the health of the service and MCP process.

### `GET /api/login-url`

Get the login URL for Zerodha authentication.

### `POST /api/rpc`

Send JSON-RPC requests to the MCP service.

### `GET /api/logs`

Get recent logs from the MCP process.

## WebSocket

The WebSocket server runs on the same port as the HTTP server. Clients can connect to `ws://localhost:3001` (or `wss://` for HTTPS).

### Messages

#### From Server

- `{ "type": "state", "isMCPReady": boolean }` - Sent when the MCP process state changes
- `{ "type": "notification", "method": string, "params": object }` - Forwarded MCP notifications
- `{ "type": "ping" }` - Sent every 30 seconds for keep-alive

#### To Server

- `{ "type": "pong" }` - Response to ping messages

## Error Handling

### Rate Limiting

If a client exceeds the rate limit (300 requests per minute), they will receive a `429 Too Many Requests` response.

### MCP Process

If the MCP process crashes, it will be automatically restarted after a short delay.

## License

MIT
