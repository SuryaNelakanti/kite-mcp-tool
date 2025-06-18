# Zerodha Trading Platform - Agent Documentation

## Overview
This document provides an overview of the Zerodha Trading Platform, a full-stack application that interfaces with the Kite trading platform. The system is built with a Node.js/Express backend and a React frontend, utilizing WebSockets for real-time data streaming.

## System Architecture

### Backend Components

#### 1. MCP Service (`mcpService.js`)
- **Purpose**: Manages communication with the Kite trading platform via Message Control Protocol (MCP)
- **Key Features**:
  - Spawns and manages the MCP process
  - Handles JSON-RPC communication
  - Implements automatic reconnection on failure
  - Maintains request/response tracking with timeouts
  - Provides a clean API for trading operations

#### 2. WebSocket Service (`webSocketService.js`)
- **Purpose**: Enables real-time bidirectional communication with clients
- **Key Features**:
  - Manages WebSocket connections
  - Implements ping-pong keep-alive mechanism
  - Broadcasts MCP state changes to all connected clients
  - Handles client authentication (if implemented)

#### 3. API Routes (`api.js`)
- **Endpoints**:
  - `GET /api/health` - Service health check
  - `GET /api/login-url` - Get authentication URL
  - `POST /api/authenticate` - Complete authentication
  - `GET /api/profile` - Get user profile
  - `GET /api/orders` - List orders
  - `GET /api/positions` - Get current positions
  - `GET /api/holdings` - Get portfolio holdings
  - `GET /api/market-quote` - Get market data
  - `POST /api/place-order` - Place new order
  - `POST /api/modify-order` - Modify existing order
  - `POST /api/cancel-order` - Cancel order
  - `GET /api/logs` - Get MCP process logs

### Frontend Components

#### 1. Pages
- Dashboard - Overview of account and positions
- Orders - Order management
- Positions - Current open positions
- Holdings - Portfolio holdings
- Market Data - Real-time market quotes
- GTT Orders - Good Till Triggered orders
- Profile - User profile and settings

#### 2. Key Features
- Real-time data updates via WebSockets
- Responsive UI with dark/light theme support
- Form validation and error handling
- Secure authentication flow

## Data Flow

1. **Authentication**
   - User logs in via OAuth with Zerodha
   - Access token is obtained and stored securely
   - Session is established

2. **Real-time Updates**
   - WebSocket connection is established
   - Server pushes updates for orders, positions, and market data
   - UI updates in real-time

3. **Trading**
   - User places/modifies/cancels orders via API
   - MCP service executes the operations
   - Results are broadcasted to all connected clients

## Security Considerations

- **Authentication**: OAuth 2.0 with Zerodha
- **Authorization**: Role-based access control (if implemented)
- **Rate Limiting**: Implemented on API endpoints
- **CORS**: Restricted to configured frontend origins
- **HTTPS**: Enforced for all communications
- **Input Validation**: All user inputs are validated
- **Error Handling**: Comprehensive error handling and logging

## Development Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Zerodha API credentials

### Environment Variables
```env
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
MCP_SSE_URL=your_mcp_sse_url
# Add other required environment variables
```

### Running the Application

1. Install dependencies:
   ```bash
   cd backend
   npm install
   
   cd ../frontend
   npm install
   ```

2. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## API Documentation

For detailed API documentation, run the application and visit `/api-docs` for the interactive Swagger documentation.

## Error Handling

The application uses HTTP status codes and consistent error response formats:

```json
{
  "error": "Error code",
  "message": "Human-readable error message",
  "details": {}
}
```

## Monitoring

- Application logs are written to stdout/stderr
- MCP process logs are captured and available via API
- Health check endpoint at `/api/health`

## Deployment

The application is configured for deployment on Railway, with configuration in `railway.json`.
