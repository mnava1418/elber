import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import type { Server } from 'socket.io'
import env from './config/env.js'
import createChatModule from './modules/chat/index.js'
import createUsersModule from './modules/users/index.js'
import createNotificationsModule from './modules/notifications/index.js'
import createVoiceModule from './modules/voice/index.js'
import createTrainingModule from './modules/training/index.js'
import { InMemoryEventBus } from './shared/events/event-bus.js'
import notFound from './shared/http/middlewares/not-found.middleware.js'
import errorHandler from './shared/http/middlewares/error.middleware.js'

interface AppDeps {
    // Modules with real-time features register their namespaces on it.
    io: Server
}

const createApp = ({io}: AppDeps) => {
    const app = express()

    // Modules never import each other: they communicate through this bus,
    // or through a port one of them declares and another implements, plugged
    // in here (the chat's coach skill uses the training data).
    const bus = new InMemoryEventBus()
    const users = createUsersModule({bus})
    createNotificationsModule({bus})
    const training = createTrainingModule()
    const {chat, diary} = createChatModule({io, training: training.coach})
    const voice = createVoiceModule()

    // Behind a proxy (Caddy in compose) every request comes from its private
    // IP: trust its X-Forwarded-For so req.ip is the client's, and the API's
    // per-IP rate limit isn't one quota shared by everyone. Only private and
    // loopback peers are trusted, so a client can't fake its IP.
    app.set('trust proxy', 'loopback, uniquelocal')

    app.use(helmet())
    // The frontend lives on another domain. Before the rate limiter so
    // preflight (OPTIONS) requests don't use up the client's quota.
    app.use(cors({origin: env.CORS_ORIGINS}))
    app.use(express.json())

    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({status: 'OK'})
    })

    // Outside the API's limit: one spoken answer is many requests. It has its
    // own limit, per user.
    app.use('/api/v1/voice', voice.router)

    const api = express.Router()
    // Only the API is limited: /health must stay reachable for health checks.
    api.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        // Per IP. The dashboard alone costs a few requests per visit (one per
        // card), so 100 ran out during normal use.
        limit: 300,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {error: {code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again later'}},
    }))
    api.use('/users', users.router)
    api.use('/chat', chat.router)
    api.use('/diary', diary.router)
    api.use('/training', training.router)
    app.use('/api/v1', api)

    // Order matters: these must be registered after every route.
    app.use(notFound)
    app.use(errorHandler)

    return app
}

export default createApp
