import { Router } from 'express'
import AuthController from './auth/auth.controller.js'
import AuthService from './auth/auth.service.js'
import buildUsersRoutes from './users.routes.js'

// Public entry point of the users module: the only file other code may import.
// When another module needs something from users, expose it here as an `api`
// contract and inject it from app.ts.
export interface UsersModule {
    router: Router
}

const createUsersModule = (): UsersModule => {
    const authService = new AuthService()
    const authController = new AuthController(authService)

    return {
        router: buildUsersRoutes({auth: authController}),
    }
}

export default createUsersModule
