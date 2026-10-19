import type http from 'http'
import { Server } from 'socket.io'
import env from './config/env.js'
import createChatModule from './modules/chat/index.js'

// Real-time counterpart of app.ts: Socket.IO shares the HTTP server with
// Express and serves /socket.io/. Each module registers its own namespace.
const createSocketServer = (server: http.Server) => {
    // Socket.IO has its own CORS settings: the Express cors() middleware
    // doesn't see these requests.
    const io = new Server(server, {cors: {origin: env.CORS_ORIGINS}})

    createChatModule({io})

    return io
}

export default createSocketServer
