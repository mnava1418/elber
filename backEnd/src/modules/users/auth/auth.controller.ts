import { Request, Response } from 'express'
import AuthService from './auth.service.js'

class AuthController {
    constructor(private readonly service: AuthService) {}

    // Express 5 forwards rejected promises to the error handler, no try/catch needed.
    resetPassword = async (req: Request, res: Response) => {
        const {email} = req.params
        await this.service.resetPassword(email as string)
        res.status(200).json({response: 'User will receive an email to reset password'})
    }
}

export default AuthController
