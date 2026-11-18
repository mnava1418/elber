import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import type { Server } from 'socket.io'
import env from './config/env.js'
import createChatModule, { ELBER_SYSTEM_PROMPT, createWeatherSkill } from './modules/chat/index.js'
import createUsersModule from './modules/users/index.js'
import createNotificationsModule from './modules/notifications/index.js'
import createMemoryModule from './modules/memory/index.js'
import createBugsModule from './modules/bugs/index.js'
import createVoiceModule from './modules/voice/index.js'
import createJournalModule, { DIARY_SYSTEM_PROMPT } from './modules/journal/index.js'
import { journalDay } from './shared/dates/journal-day.js'
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
    const weather = createWeatherSkill()
    const memory = createMemoryModule()
    const bugs = createBugsModule()
    const chat = createChatModule({io, section: {
        namespace: '/chat',
        collection: 'conversations',
        systemPrompt: ELBER_SYSTEM_PROMPT,
        skills: [weather, memory.skill, bugs],
        webTools: true,
    }})
    // The diary only has its own tools and the profile: the chat can't reach
    // its conversations, and it can't reach the chat's notes or the web.
    const diary = createChatModule({io, section: {
        namespace: '/diary',
        collection: 'diary',
        systemPrompt: DIARY_SYSTEM_PROMPT,
        skills: [createJournalModule(), memory.profile],
        webTools: false,
        canUse: (uid) => uid === env.MEMORY_OWNER_UID,
        daily: (now) => {
            const {date, title} = journalDay(now)
            return {id: date, title: title.charAt(0).toUpperCase() + title.slice(1)}
        },
    }})
    createNotificationsModule({bus})
    const voice = createVoiceModule()

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
        limit: 100, // per IP
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {error: {code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again later'}},
    }))
    api.use('/users', users.router)
    api.use('/chat', chat.router)
    api.use('/diary', diary.router)
    app.use('/api/v1', api)

    // Order matters: these must be registered after every route.
    app.use(notFound)
    app.use(errorHandler)

    return app
}

export default createApp
