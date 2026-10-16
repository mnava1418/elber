import { Router } from 'express'
import env from '../../config/env.js'
import { EventBus } from '../../shared/events/event-bus.js'
import { firebaseAuth } from '../../shared/firebase/firebase-admin.js'
import AuthController from './auth/auth.controller.js'
import AuthService from './auth/auth.service.js'
import buildUsersRoutes from './users.routes.js'

// Public entry point of the users module: only app.ts imports it. Other
// modules never import users; they react to the events it publishes.
export interface UsersModule {
    router: Router
}

interface UsersModuleDeps {
    bus: EventBus
}

const createUsersModule = ({bus}: UsersModuleDeps): UsersModule => {
    const authService = new AuthService(firebaseAuth, bus, env.PASSWORD_RESET_CONTINUE_URL)
    const authController = new AuthController(authService)

    return {
        router: buildUsersRoutes({auth: authController}),
    }
}

export default createUsersModule
