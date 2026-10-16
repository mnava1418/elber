import { EmailSender } from '../domain/email-sender.port.js'
import passwordResetTemplate from './templates/password-reset.template.js'

export interface SendPasswordResetEmailInput {
    email: string
    resetLink: string
}

class SendPasswordResetEmailUseCase {
    constructor(private readonly emailSender: EmailSender) {}

    execute = async ({email, resetLink}: SendPasswordResetEmailInput) => {
        await this.emailSender.send({to: email, ...passwordResetTemplate({resetLink})})
    }
}

export default SendPasswordResetEmailUseCase
