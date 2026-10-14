import { Router } from 'express'
import UserAuthController from '../controllers/auth.controller.js'

const getAuthRouter = (controller: UserAuthController) => {
    const authRouter = Router()
    authRouter.get('/:email', controller.resetPassword)

    return authRouter
}

export default getAuthRouter