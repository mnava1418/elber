import { Router } from 'express'
import getAuthRouter from './auth.routes.js'
import UserAuthController from '../controllers/auth.controller.js'

interface UserControllers {
    auth: UserAuthController
}

const buildRoutes = ({auth}: UserControllers) => {
    const router = Router()
    const authRouter = getAuthRouter(auth)

    router.use('/auth', authRouter)

    return router
}

export default buildRoutes