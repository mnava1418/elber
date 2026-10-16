import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EmailSender } from '../../../../src/modules/notifications/domain/email-sender.port.js'
import SendPasswordResetEmailUseCase from '../../../../src/modules/notifications/application/send-password-reset-email.use-case.js'

const EMAIL = 'user@example.com'
const RESET_LINK = 'https://example.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=abc'

describe('SendPasswordResetEmailUseCase', () => {
    // Fake adapter: the use case only knows the port, so no email is sent.
    const send = vi.fn<EmailSender['send']>()
    const emailSender: EmailSender = {send}

    let useCase: SendPasswordResetEmailUseCase

    beforeEach(() => {
        vi.resetAllMocks()
        send.mockResolvedValue()
        useCase = new SendPasswordResetEmailUseCase(emailSender)
    })

    const sentEmail = () => send.mock.calls[0]![0]

    it('sends exactly one email to the requester', async () => {
        await useCase.execute({email: EMAIL, resetLink: RESET_LINK})

        expect(send).toHaveBeenCalledOnce()
        expect(sentEmail().to).toBe(EMAIL)
    })

    it('uses the password reset subject', async () => {
        await useCase.execute({email: EMAIL, resetLink: RESET_LINK})

        expect(sentEmail().subject).toBe('Restablece tu contraseña')
    })

    it('puts the link in the HTML body with & escaped', async () => {
        await useCase.execute({email: EMAIL, resetLink: RESET_LINK})

        expect(sentEmail().html).toContain(
            'href="https://example.firebaseapp.com/__/auth/action?mode=resetPassword&amp;oobCode=abc"',
        )
    })

    it('puts the raw link in the plain-text body', async () => {
        await useCase.execute({email: EMAIL, resetLink: RESET_LINK})

        expect(sentEmail().text).toContain(RESET_LINK)
    })

    it('escapes HTML in the link so it cannot inject markup', async () => {
        await useCase.execute({email: EMAIL, resetLink: 'https://x.com/?a="><script>alert(1)</script>'})

        expect(sentEmail().html).not.toContain('<script>')
        expect(sentEmail().html).toContain('&quot;&gt;&lt;script&gt;')
    })

    it('propagates sender failures', async () => {
        const error = new Error('provider down')
        send.mockRejectedValue(error)

        await expect(useCase.execute({email: EMAIL, resetLink: RESET_LINK})).rejects.toBe(error)
    })
})
