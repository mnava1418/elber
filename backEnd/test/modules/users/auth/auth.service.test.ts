import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Auth } from 'firebase-admin/auth'
import type { EventBus } from '../../../../src/shared/events/event-bus.js'
import AuthService from '../../../../src/modules/users/auth/auth.service.js'

const CONTINUE_URL = 'http://localhost:5173/login'
const EMAIL = 'user@example.com'
const RESET_LINK = 'https://example.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=abc'

// Firebase Admin errors expose a `code` such as "auth/user-not-found".
const firebaseError = (code: string) => Object.assign(new Error(code), {code})

describe('AuthService.requestPasswordReset', () => {
    // Test doubles: Firebase is never called and no event reaches a real bus.
    const generatePasswordResetLink = vi.fn<Auth['generatePasswordResetLink']>()
    const publish = vi.fn()
    const auth = {generatePasswordResetLink} as unknown as Auth
    const bus: EventBus = {publish, subscribe: vi.fn()}

    let service: AuthService

    beforeEach(() => {
        vi.resetAllMocks()
        service = new AuthService(auth, bus, CONTINUE_URL)
    })

    it('generates the reset link with the continue URL', async () => {
        generatePasswordResetLink.mockResolvedValue(RESET_LINK)

        await service.requestPasswordReset(EMAIL)

        expect(generatePasswordResetLink).toHaveBeenCalledExactlyOnceWith(EMAIL, {url: CONTINUE_URL})
    })

    it('publishes users.password_reset_requested with the email and the link', async () => {
        generatePasswordResetLink.mockResolvedValue(RESET_LINK)

        await service.requestPasswordReset(EMAIL)

        expect(publish).toHaveBeenCalledExactlyOnceWith('users.password_reset_requested', {
            email: EMAIL,
            resetLink: RESET_LINK,
        })
    })

    it.each(['auth/email-not-found', 'auth/user-not-found', 'auth/user-disabled'])(
        'finishes silently without publishing when Firebase answers %s',
        async (code) => {
            generatePasswordResetLink.mockRejectedValue(firebaseError(code))

            await expect(service.requestPasswordReset(EMAIL)).resolves.toBeUndefined()
            expect(publish).not.toHaveBeenCalled()
        },
    )

    it('rethrows unexpected Firebase errors without publishing', async () => {
        const error = firebaseError('auth/internal-error')
        generatePasswordResetLink.mockRejectedValue(error)

        await expect(service.requestPasswordReset(EMAIL)).rejects.toBe(error)
        expect(publish).not.toHaveBeenCalled()
    })

    it('rethrows errors that are not Firebase errors', async () => {
        const error = new Error('network down')
        generatePasswordResetLink.mockRejectedValue(error)

        await expect(service.requestPasswordReset(EMAIL)).rejects.toBe(error)
        expect(publish).not.toHaveBeenCalled()
    })
})
