import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Auth, DecodedIdToken } from 'firebase-admin/auth'
import { createFirebaseTokenVerifier } from '../../../src/shared/auth/token-verifier.js'

const TOKEN = 'firebase-id-token'

const firebaseError = (code: string) => Object.assign(new Error(code), {code})

describe('createFirebaseTokenVerifier', () => {
    // Test double: Firebase is never called.
    const verifyIdToken = vi.fn<Auth['verifyIdToken']>()
    const auth = {verifyIdToken} as unknown as Auth
    const verify = createFirebaseTokenVerifier(auth)

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('verifies the token checking for revocation', async () => {
        verifyIdToken.mockResolvedValue({uid: 'uid-1'} as DecodedIdToken)

        await verify(TOKEN)

        expect(verifyIdToken).toHaveBeenCalledExactlyOnceWith(TOKEN, true)
    })

    it('returns the uid and email of a valid token', async () => {
        verifyIdToken.mockResolvedValue({uid: 'uid-1', email: 'user@example.com'} as DecodedIdToken)

        await expect(verify(TOKEN)).resolves.toEqual({uid: 'uid-1', email: 'user@example.com'})
    })

    it.each([
        'auth/argument-error',
        'auth/invalid-id-token',
        'auth/id-token-expired',
        'auth/id-token-revoked',
        'auth/user-disabled',
        'auth/user-not-found',
    ])('returns null when Firebase answers %s', async (code) => {
        verifyIdToken.mockRejectedValue(firebaseError(code))

        await expect(verify(TOKEN)).resolves.toBeNull()
    })

    it('rethrows unexpected Firebase errors', async () => {
        const error = firebaseError('auth/internal-error')
        verifyIdToken.mockRejectedValue(error)

        await expect(verify(TOKEN)).rejects.toBe(error)
    })

    it('rethrows errors that are not Firebase errors', async () => {
        const error = new Error('network down')
        verifyIdToken.mockRejectedValue(error)

        await expect(verify(TOKEN)).rejects.toBe(error)
    })
})
