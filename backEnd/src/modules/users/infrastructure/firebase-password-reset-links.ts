import type { Auth } from 'firebase-admin/auth'
import { hasFirebaseErrorCode } from '../../../shared/firebase/firebase-errors.js'
import type { PasswordResetLinks } from '../domain/password-reset-links.port.js'

// Adapter: the reset links Firebase Auth generates for its accounts.
class FirebasePasswordResetLinks implements PasswordResetLinks {
    constructor(
        private readonly auth: Auth,
        // Page the user lands on after changing the password. Its domain must
        // be in Firebase Console > Authentication > Settings > Authorized domains.
        private readonly continueUrl: string,
    ) {}

    generate = async (email: string): Promise<string | null> => {
        try {
            return await this.auth.generatePasswordResetLink(email, {url: this.continueUrl})
        } catch (error) {
            if (hasFirebaseErrorCode(error, 'auth/email-not-found', 'auth/user-not-found', 'auth/user-disabled')) return null
            throw error
        }
    }
}

export default FirebasePasswordResetLinks
