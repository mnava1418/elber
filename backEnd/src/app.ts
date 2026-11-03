import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import type { Server } from 'socket.io'
import env from './config/env.js'
import createChatModule from './modules/chat/index.js'
import createUsersModule from './modules/users/index.js'
import createNotificationsModule from './modules/notifications/index.js'
import createMemoryModule from './modules/memory/index.js'
import createWeatherModule from './modules/weather/index.js'
import createBugsModule from './modules/bugs/index.js'
import { InMemoryEventBus } from './shared/events/event-bus.js'
import notFound from './shared/http/middlewares/not-found.middleware.js'
import errorHandler from './shared/http/middlewares/error.middleware.js'

interface AppDeps {
    // Modules with real-time features register their namespaces on it.
    io: Server
}

const createApp = ({io}: AppDeps) => {
    const app = express()

    // Modules never import each other: they communicate through this bus.
    const bus = new InMemoryEventBus()
    const users = createUsersModule({bus})
    // Skills don't talk to the chat through the bus: they hand it their tools
    // and what they know about the user.
    const weather = createWeatherModule()
    const memory = createMemoryModule()
    const bugs = createBugsModule()
    const chat = createChatModule({io, skills: [weather, memory, bugs]})
    createNotificationsModule({bus})

    app.use(helmet())
    // The frontend lives on another domain. Before the rate limiter so
    // preflight (OPTIONS) requests don't use up the client's quota.
    app.use(cors({origin: env.CORS_ORIGINS}))
    app.use(express.json())

    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({status: 'OK'})
    })

    const api = express.Router()
    // Only the API is limited: /health must stay reachable for health checks.
    api.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100, // per IP
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {error: {code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again later'}},
    }))
    api.use('/users', users.router)
    api.use('/chat', chat.router)
    app.use('/api/v1', api)

    // Order matters: these must be registered after every route.
    app.use(notFound)
    app.use(errorHandler)

    return app
}

export default createApp
