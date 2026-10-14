import express, { Request, Response } from 'express'
import createUsersModule from './modules/users/index.js'
import notFound from './shared/http/middlewares/not-found.middleware.js'
import errorHandler from './shared/http/middlewares/error.middleware.js'

const createApp = () => {
    const app = express()
    const users = createUsersModule()

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
