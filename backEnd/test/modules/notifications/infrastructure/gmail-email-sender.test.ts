import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Email } from '../../../../src/modules/notifications/domain/email.js'
import GmailEmailSender, { GmailConfig } from '../../../../src/modules/notifications/infrastructure/gmail-email-sender.js'

// Replace nodemailer entirely: no SMTP connection, no OAuth token request.
const {createTransport, sendMail} = vi.hoisted(() => ({
    createTransport: vi.fn(),
    sendMail: vi.fn(),
}))

vi.mock('nodemailer', () => ({default: {createTransport}}))

const CONFIG: GmailConfig = {
    sender: 'no-reply@example.com',
    fromName: 'Elber',
    serviceClientId: '1234567890',
    privateKey: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n',
}

const EMAIL: Email = {
    to: 'user@example.com',
    subject: 'Subject',
    html: '<p>Hi</p>',
    text: 'Hi',
}

describe('GmailEmailSender', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        createTransport.mockReturnValue({sendMail})
        sendMail.mockResolvedValue({messageId: 'fake-id'})
    })

    it('connects to Gmail SMTP over TLS with the service account (OAuth2)', () => {
        new GmailEmailSender(CONFIG)

        expect(createTransport).toHaveBeenCalledExactlyOnceWith({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: CONFIG.sender,
                serviceClient: CONFIG.serviceClientId,
                privateKey: CONFIG.privateKey,
            },
        })
    })

    it('sends the email from the configured sender', async () => {
        await new GmailEmailSender(CONFIG).send(EMAIL)

        expect(sendMail).toHaveBeenCalledExactlyOnceWith({
            from: {name: CONFIG.fromName, address: CONFIG.sender},
            to: EMAIL.to,
            subject: EMAIL.subject,
            html: EMAIL.html,
            text: EMAIL.text,
        })
    })

    it('propagates delivery failures', async () => {
        const error = new Error('Invalid login')
        sendMail.mockRejectedValue(error)

        await expect(new GmailEmailSender(CONFIG).send(EMAIL)).rejects.toBe(error)
    })
})
