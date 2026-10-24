import { Router } from 'express'
import type AuthController from './auth.controller.js'

interface UsersControllers {
    auth: AuthController
}

const buildUsersRoutes = ({auth}: UsersControllers) => {
    const router = Router()

    router.post('/auth/password-reset', auth.requestPasswordReset)

    return router
}

export default buildUsersRoutes
