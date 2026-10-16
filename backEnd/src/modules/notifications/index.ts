import env from '../../config/env.js'
import { EventBus } from '../../shared/events/event-bus.js'
import SendPasswordResetEmailUseCase from './application/send-password-reset-email.use-case.js'
import GmailEmailSender from './infrastructure/gmail-email-sender.js'
import buildPasswordResetRequestedHandler from './presentation/password-reset-requested.handler.js'

// Public entry point and composition root of the notifications module.
// It has no HTTP routes: it only reacts to events published on the bus.
interface NotificationsModuleDeps {
    bus: EventBus
}

const createNotificationsModule = ({bus}: NotificationsModuleDeps) => {
    // To switch email provider, swap this adapter for another EmailSender.
    const emailSender = new GmailEmailSender({
        sender: env.GMAIL_SENDER,
        fromName: env.MAIL_FROM_NAME,
        serviceClientId: env.GOOGLE_SERVICE_ACCOUNT.client_id,
        privateKey: env.GOOGLE_SERVICE_ACCOUNT.private_key,
    })

    const sendPasswordResetEmail = new SendPasswordResetEmailUseCase(emailSender)

    bus.subscribe('users.password_reset_requested', buildPasswordResetRequestedHandler(sendPasswordResetEmail))
}

export default createNotificationsModule
