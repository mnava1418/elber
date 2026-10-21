import { Auth } from 'firebase-admin/auth'
import { hasFirebaseErrorCode } from '../firebase/firebase-errors.js'

// The signed-in user behind a request or a socket connection.
export interface AuthUser {
    uid: string
    email?: string
}

// Resolves to null when the token is not valid (malformed, expired, revoked,
// disabled user). Rejects only on unexpected failures (e.g. Firebase is down).
export type TokenVerifier = (token: string) => Promise<AuthUser | null>

const INVALID_TOKEN_CODES = [
    'auth/argument-error',
    'auth/invalid-id-token',
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/user-disabled',
    'auth/user-not-found',
]

export const createFirebaseTokenVerifier = (auth: Auth): TokenVerifier => async (token) => {
    try {
        // checkRevoked costs a call to Firebase, but also rejects tokens of
        // disabled or signed-out users. Fine for sockets (once per connection)
        // and for the few HTTP requests the chat history makes.
        const decoded = await auth.verifyIdToken(token, true)
        return {uid: decoded.uid, email: decoded.email}
    } catch (error) {
        if (hasFirebaseErrorCode(error, ...INVALID_TOKEN_CODES)) return null
        throw error
    }
}
