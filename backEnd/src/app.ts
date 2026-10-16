import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import env from './config/env.js'
import createUsersModule from './modules/users/index.js'
import createNotificationsModule from './modules/notifications/index.js'
import { InMemoryEventBus } from './shared/events/event-bus.js'
import notFound from './shared/http/middlewares/not-found.middleware.js'
import errorHandler from './shared/http/middlewares/error.middleware.js'

const createApp = () => {
    const app = express()

    // Modules never import each other: they communicate through this bus.
    const bus = new InMemoryEventBus()
    const users = createUsersModule({bus})
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
        windowMs: 15 * 60 * 1000, // 15 minutos
        limit: 100, // por IP
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {error: {code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again later'}},
    }))
    api.use('/users', users.router)
    app.use('/api/v1', api)

    // Order matters: these must be registered after every route.
    app.use(notFound)
    app.use(errorHandler)

    return app
}

export default createApp
