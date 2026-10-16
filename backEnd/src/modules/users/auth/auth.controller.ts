import { Request, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from '../../../shared/http/errors.js'
import AuthService from './auth.service.js'

const passwordResetSchema = z.object({
    // Normalize first, then validate: z.email() checks before any transform.
    email: z.string().trim().toLowerCase().pipe(z.email()),
})

class AuthController {
    constructor(private readonly service: AuthService) {}

    // Express 5 forwards rejected promises to the error handler, no try/catch needed.
    requestPasswordReset = async (req: Request, res: Response) => {
        const parsed = passwordResetSchema.safeParse(req.body)
        if (!parsed.success) {
            throw new BadRequestError('A valid email is required', 'INVALID_EMAIL')
        }

        await this.service.requestPasswordReset(parsed.data.email)
        // Same answer whether or not the account exists.
        res.status(200).json({response: 'If the email is registered, it will receive a link to reset the password'})
    }
}

export default AuthController
