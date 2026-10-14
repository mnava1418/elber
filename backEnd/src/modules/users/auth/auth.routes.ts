import { Router } from 'express'
import AuthController from './auth.controller.js'

const buildAuthRoutes = (controller: AuthController) => {
    const router = Router()
    router.get('/:email', controller.resetPassword)

    return router
}

export default buildAuthRoutes
