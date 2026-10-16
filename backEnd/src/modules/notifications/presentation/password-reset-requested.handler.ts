import { EventHandler } from '../../../shared/events/event-bus.js'
import SendPasswordResetEmailUseCase from '../application/send-password-reset-email.use-case.js'

// Inbound adapter: translates the event into a use case call. Errors bubble
// up to the event bus, which logs them without the payload.
const buildPasswordResetRequestedHandler = (
    useCase: SendPasswordResetEmailUseCase,
): EventHandler<'users.password_reset_requested'> =>
    ({email, resetLink}) => useCase.execute({email, resetLink})

export default buildPasswordResetRequestedHandler
