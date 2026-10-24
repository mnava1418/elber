import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Auth } from 'firebase-admin/auth'
import FirebasePasswordResetLinks from '../../../../src/modules/users/infrastructure/firebase-password-reset-links.js'

const CONTINUE_URL = 'http://localhost:5173/login'
const EMAIL = 'user@example.com'
const RESET_LINK = 'https://example.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=abc'

// Firebase Admin errors expose a `code` such as "auth/user-not-found".
const firebaseError = (code: string) => Object.assign(new Error(code), {code})

describe('FirebasePasswordResetLinks', () => {
    // Test double: Firebase is never called.
    const generatePasswordResetLink = vi.fn<Auth['generatePasswordResetLink']>()
    const auth = {generatePasswordResetLink} as unknown as Auth

    let links: FirebasePasswordResetLinks

    beforeEach(() => {
        vi.resetAllMocks()
        links = new FirebasePasswordResetLinks(auth, CONTINUE_URL)
    })

    it('generates the reset link with the continue URL', async () => {
        generatePasswordResetLink.mockResolvedValue(RESET_LINK)

        expect(await links.generate(EMAIL)).toBe(RESET_LINK)
        expect(generatePasswordResetLink).toHaveBeenCalledExactlyOnceWith(EMAIL, {url: CONTINUE_URL})
    })

    it.each(['auth/email-not-found', 'auth/user-not-found', 'auth/user-disabled'])(
        'gives no link when Firebase answers %s',
        async (code) => {
            generatePasswordResetLink.mockRejectedValue(firebaseError(code))

            expect(await links.generate(EMAIL)).toBeNull()
        },
    )

    it('rethrows unexpected Firebase errors', async () => {
        const error = firebaseError('auth/internal-error')
        generatePasswordResetLink.mockRejectedValue(error)

        await expect(links.generate(EMAIL)).rejects.toBe(error)
    })

    it('rethrows errors that are not Firebase errors', async () => {
        const error = new Error('network down')
        generatePasswordResetLink.mockRejectedValue(error)

        await expect(links.generate(EMAIL)).rejects.toBe(error)
    })
})
