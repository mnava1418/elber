import express, { Request, Response } from 'express'
import createUsersModule from './modules/users/index.js'

const createApp = () => {
    const app = express()
    const users = createUsersModule()

    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({status: 'OK'})
    })

    app.use('/user', users.router)

    return app
}

export default createApp
