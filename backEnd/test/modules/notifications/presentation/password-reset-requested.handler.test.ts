import { describe, expect, it, vi } from 'vitest'
import SendPasswordResetEmailUseCase from '../../../../src/modules/notifications/application/send-password-reset-email.use-case.js'
import buildPasswordResetRequestedHandler from '../../../../src/modules/notifications/presentation/password-reset-requested.handler.js'

const PAYLOAD = {email: 'user@example.com', resetLink: 'https://example.com/reset?oobCode=abc'}

// Only execute() is used by the handler; no sender behind it.
const fakeUseCase = (execute: SendPasswordResetEmailUseCase['execute']) =>
    ({execute}) as unknown as SendPasswordResetEmailUseCase

describe('password-reset-requested handler', () => {
    it('runs the use case with the event payload', async () => {
        const execute = vi.fn<SendPasswordResetEmailUseCase['execute']>().mockResolvedValue()
        const handler = buildPasswordResetRequestedHandler(fakeUseCase(execute))

        await handler(PAYLOAD)

        expect(execute).toHaveBeenCalledExactlyOnceWith(PAYLOAD)
    })

    it('propagates use case failures so the event bus can log them', async () => {
        const error = new Error('provider down')
        const execute = vi.fn<SendPasswordResetEmailUseCase['execute']>().mockRejectedValue(error)
        const handler = buildPasswordResetRequestedHandler(fakeUseCase(execute))

        await expect(handler(PAYLOAD)).rejects.toBe(error)
    })
})
