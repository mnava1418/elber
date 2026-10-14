import { Router } from 'express'
import AuthController from './auth/auth.controller.js'
import buildAuthRoutes from './auth/auth.routes.js'

interface UsersControllers {
    auth: AuthController
}

const buildUsersRoutes = ({auth}: UsersControllers) => {
    const router = Router()

    router.use('/auth', buildAuthRoutes(auth))

    return router
}

export default buildUsersRoutes
