import express, { Request, Response } from 'express'
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

    app.use(express.json())

    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({status: 'OK'})
    })

    const api = express.Router()
    api.use('/users', users.router)
    app.use('/api/v1', api)

    // Order matters: these must be registered after every route.
    app.use(notFound)
    app.use(errorHandler)

    return app
}

export default createApp
