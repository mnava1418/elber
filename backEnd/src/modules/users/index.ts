import { Router } from 'express'
import AuthController from './auth/auth.controller.js'
import AuthService from './auth/auth.service.js'
import buildUsersRoutes from './users.routes.js'

// Public contract of the users module. Other modules must depend on this,
// never on files inside the module.
export interface UsersApi {
    resetPassword(email: string): void
}

export interface UsersModule {
    router: Router
    api: UsersApi
}

const createUsersModule = (): UsersModule => {
    const authService = new AuthService()
    const authController = new AuthController(authService)

    return {
        router: buildUsersRoutes({auth: authController}),
        api: {
            resetPassword: authService.resetPassword,
        },
    }
}

export default createUsersModule
