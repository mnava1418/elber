import { Router } from 'express'
import AuthController from './auth.controller.js'

const buildAuthRoutes = (controller: AuthController) => {
    const router = Router()
    router.post('/password-reset', controller.requestPasswordReset)

    return router
}

export default buildAuthRoutes
