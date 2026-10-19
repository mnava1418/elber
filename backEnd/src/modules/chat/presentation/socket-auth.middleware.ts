import type { ExtendedError, Socket } from 'socket.io'
import type { TokenVerifier } from '../../../shared/auth/token-verifier.js'

// Socket.IO hands this error to the client as `connect_error`: `message` and
// `data` are what the frontend sees, so keep them generic.
const connectionError = (message: string, code: string): ExtendedError =>
    Object.assign(new Error(message), {data: {code}})

// Runs once per connection (and again on every reconnection), before any
// event is accepted. The client sends its Firebase ID token in `auth.token`.
const buildSocketAuth = (verify: TokenVerifier) =>
    async (socket: Socket, next: (err?: ExtendedError) => void) => {
        const token: unknown = socket.handshake.auth?.token
        if (typeof token !== 'string' || token === '') {
            return next(connectionError('Missing auth token', 'UNAUTHORIZED'))
        }

        try {
            const user = await verify(token)
            if (!user) {
                return next(connectionError('Invalid auth token', 'UNAUTHORIZED'))
            }
            socket.data.user = user
            next()
        } catch (error) {
            console.error(error)
            next(connectionError('Internal server error', 'INTERNAL_ERROR'))
        }
    }

export default buildSocketAuth
