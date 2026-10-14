import { Request, Response } from 'express'
import UserAuthServices from '../services/auth.service.js'

class UserAuthController {
    constructor(private readonly service: UserAuthServices) {}

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

export default UserAuthController