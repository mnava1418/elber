import type { EventBus } from '../../../shared/events/event-bus.js'
import type { PasswordResetLinks } from '../domain/password-reset-links.port.js'

// Starts a password reset: gets the link and announces it, so notifications
// emails it. Without an active account it finishes silently, so the endpoint
// can't be used to find out which emails are registered.
class RequestPasswordResetUseCase {
    constructor(
        private readonly links: PasswordResetLinks,
        private readonly bus: EventBus,
    ) {}

    execute = async (email: string) => {
        const resetLink = await this.links.generate(email)
        if (resetLink === null) return
        this.bus.publish('users.password_reset_requested', {email, resetLink})
    }
}

export default RequestPasswordResetUseCase
