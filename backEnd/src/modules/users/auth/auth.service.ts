import { Auth } from 'firebase-admin/auth'
import { EventBus } from '../../../shared/events/event-bus.js'
import { hasFirebaseErrorCode } from '../../../shared/firebase/firebase-errors.js'

class AuthService {
    constructor(
        private readonly auth: Auth,
        private readonly bus: EventBus,
        // Page the user lands on after changing the password. Its domain must
        // be in Firebase Console > Authentication > Settings > Authorized domains.
        private readonly passwordResetContinueUrl: string,
    ) {}

    requestPasswordReset = async (email: string) => {
        let resetLink: string
        try {
            resetLink = await this.auth.generatePasswordResetLink(email, {url: this.passwordResetContinueUrl})
        } catch (error) {
            // Unknown or disabled accounts finish silently, so the endpoint
            // can't be used to find out which emails are registered.
            if (hasFirebaseErrorCode(error, 'auth/email-not-found', 'auth/user-not-found', 'auth/user-disabled')) return
            throw error
        }

        this.bus.publish('users.password_reset_requested', {email, resetLink})
    }
}

export default AuthService
