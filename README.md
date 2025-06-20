# Zerodha MCP Dashboard

React + Vite powered trading dashboard. Backend proxy runs on `/rpc` and WebSocket on `/ws`.

## Development

```bash
pnpm install --filter ./backend
pnpm install --filter ./frontend
```

Start services in separate terminals:

```bash
cd backend && pnpm dev
cd ../frontend && pnpm dev
```

## Deployment

This repo is configured for Railway. Push your changes and deploy.

Environment variables in `.env` (see `.env.example`):

- `PORT` - HTTP port
- `OPENAI_API_KEY` - optional, for /chat
- `CORS_ORIGIN` - allowed frontend origin

Deploy on Railway using provided `railway.json`.
