import { Router } from 'express'
import env from '../../config/env.js'
import { EventBus } from '../../shared/events/event-bus.js'
import { firebaseAuth } from '../../shared/firebase/firebase-admin.js'
import RequestPasswordResetUseCase from './application/request-password-reset.use-case.js'
import FirebasePasswordResetLinks from './infrastructure/firebase-password-reset-links.js'
import AuthController from './presentation/auth.controller.js'
import buildUsersRoutes from './presentation/users.routes.js'

// Public entry point and composition root of the users module: only app.ts
// imports it. Other modules never import users; they react to the events it
// publishes.
export interface UsersModule {
    router: Router
}

interface UsersModuleDeps {
    bus: EventBus
}

const createUsersModule = ({bus}: UsersModuleDeps): UsersModule => {
    // To switch auth provider, swap this adapter for another PasswordResetLinks.
    const links = new FirebasePasswordResetLinks(firebaseAuth, env.PASSWORD_RESET_CONTINUE_URL)
    const requestPasswordReset = new RequestPasswordResetUseCase(links, bus)

    return {
        router: buildUsersRoutes({auth: new AuthController(requestPasswordReset)}),
    }
}

export default createUsersModule
