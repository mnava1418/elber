import { Server } from 'socket.io'
import env from './config/env.js'

// Real-time counterpart of Express: once attached (main.ts), Socket.IO shares
// the HTTP server and serves /socket.io/. Each module registers its own
// namespace on it (app.ts hands it to them).
const createSocketServer = () =>
    // Socket.IO has its own CORS settings: the Express cors() middleware
    // doesn't see these requests.
    new Server({cors: {origin: env.CORS_ORIGINS}})

export default createSocketServer
