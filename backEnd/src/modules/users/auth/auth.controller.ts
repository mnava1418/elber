import { Request, Response } from 'express'
import AuthService from './auth.service.js'

class AuthController {
    constructor(private readonly service: AuthService) {}

    resetPassword = (req: Request, res: Response) => {
        try {
            const {email} = req.params
            this.service.resetPassword(email as string)
            res.status(200).json({response: 'User will receive an email to reset password'})
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            res.status(500).json({error: errorMessage})
        }
    }
}

export default AuthController
