import { beforeEach, describe, expect, it, vi } from 'vitest'
import RequestPasswordResetUseCase from '../../../../src/modules/users/application/request-password-reset.use-case.js'
import type { PasswordResetLinks } from '../../../../src/modules/users/domain/password-reset-links.port.js'
import type { EventBus } from '../../../../src/shared/events/event-bus.js'

const EMAIL = 'user@example.com'
const RESET_LINK = 'https://example.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=abc'

describe('RequestPasswordResetUseCase', () => {
    // Test doubles: no Firebase, and no event reaches a real bus.
    const generate = vi.fn<PasswordResetLinks['generate']>()
    const publish = vi.fn()
    const bus: EventBus = {publish, subscribe: vi.fn()}

    let useCase: RequestPasswordResetUseCase

    beforeEach(() => {
        vi.resetAllMocks()
        useCase = new RequestPasswordResetUseCase({generate}, bus)
    })

    it('publishes users.password_reset_requested with the email and the link', async () => {
        generate.mockResolvedValue(RESET_LINK)

        await useCase.execute(EMAIL)

        expect(generate).toHaveBeenCalledExactlyOnceWith(EMAIL)
        expect(publish).toHaveBeenCalledExactlyOnceWith('users.password_reset_requested', {email: EMAIL, resetLink: RESET_LINK})
    })

    it('finishes silently without publishing when no active account has the email', async () => {
        generate.mockResolvedValue(null)

        await expect(useCase.execute(EMAIL)).resolves.toBeUndefined()
        expect(publish).not.toHaveBeenCalled()
    })

    it('rethrows when the link cannot be generated, without publishing', async () => {
        const error = new Error('firebase down')
        generate.mockRejectedValue(error)

        await expect(useCase.execute(EMAIL)).rejects.toBe(error)
        expect(publish).not.toHaveBeenCalled()
    })
})
