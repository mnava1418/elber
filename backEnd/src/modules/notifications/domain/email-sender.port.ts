import { Email } from './email.js'

// Port: what the application needs to deliver an email. Each provider
// (Gmail, Resend, SES...) is an adapter in infrastructure/ implementing it.
export interface EmailSender {
    send(email: Email): Promise<void>
}
