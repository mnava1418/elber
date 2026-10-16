import nodemailer, { Transporter } from 'nodemailer'
import { Email } from '../domain/email.js'
import { EmailSender } from '../domain/email-sender.port.js'

export interface GmailConfig {
    // Workspace user the service account impersonates; also the From address.
    sender: string
    fromName: string
    // Service account client_id, authorized via domain-wide delegation
    // with the https://mail.google.com/ scope.
    serviceClientId: string
    privateKey: string
}

// Adapter: sends through Gmail SMTP authenticated with OAuth2. Nodemailer
// requests and refreshes the access token using the service account key.
class GmailEmailSender implements EmailSender {
    private readonly transporter: Transporter
    private readonly from: {name: string, address: string}

    constructor(config: GmailConfig) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: config.sender,
                serviceClient: config.serviceClientId,
                privateKey: config.privateKey,
            },
        })
        this.from = {name: config.fromName, address: config.sender}
    }

    send = async (email: Email) => {
        await this.transporter.sendMail({
            from: this.from,
            to: email.to,
            subject: email.subject,
            html: email.html,
            text: email.text,
        })
    }
}

export default GmailEmailSender
