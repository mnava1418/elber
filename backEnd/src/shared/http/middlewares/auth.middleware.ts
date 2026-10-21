import { NextFunction, Request, Response } from 'express'
import type { AuthUser, TokenVerifier } from '../../auth/token-verifier.js'
import { UnauthorizedError } from '../errors.js'

// HTTP counterpart of the socket auth: the client sends its Firebase ID token
// as `Authorization: Bearer <token>`. Unexpected failures (Firebase down)
// reach the error handler as a 500.
export const buildRequireAuth = (verify: TokenVerifier) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const [scheme, token] = req.headers.authorization?.split(' ') ?? []
        if (scheme !== 'Bearer' || !token) {
            throw new UnauthorizedError('Missing auth token')
        }

        const user = await verify(token)
        if (!user) {
            throw new UnauthorizedError('Invalid auth token')
        }
        res.locals.user = user
        next()
    }

// The user requireAuth verified. Throws if the route isn't behind it, so
// forgetting the middleware fails closed.
export const authUser = (res: Response): AuthUser => {
    const user: unknown = res.locals.user
    if (!user) throw new UnauthorizedError()
    return user as AuthUser
}
