import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Socket } from 'socket.io'
import type { TokenVerifier } from '../../../../src/shared/auth/token-verifier.js'
import buildSocketAuth from '../../../../src/modules/chat/presentation/socket-auth.middleware.js'

const TOKEN = 'firebase-id-token'
const USER = {uid: 'uid-1', email: 'user@example.com'}

// Only the parts of a socket the middleware touches.
const fakeSocket = (auth: Record<string, unknown>) =>
    ({handshake: {auth}, data: {}}) as unknown as Socket

describe('socket auth middleware', () => {
    const verify = vi.fn<TokenVerifier>()
    const next = vi.fn()
    const middleware = buildSocketAuth(verify)

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('accepts the connection and stores the user when the token is valid', async () => {
        verify.mockResolvedValue(USER)
        const socket = fakeSocket({token: TOKEN})

        await middleware(socket, next)

        expect(verify).toHaveBeenCalledExactlyOnceWith(TOKEN)
        expect(socket.data.user).toEqual(USER)
        expect(next).toHaveBeenCalledExactlyOnceWith()
    })

    it.each([
        ['no token', {}],
        ['an empty token', {token: ''}],
        ['a token that is not a string', {token: 123}],
    ])('rejects with UNAUTHORIZED when the client sends %s', async (_case, auth) => {
        await middleware(fakeSocket(auth), next)

        expect(verify).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({message: 'Missing auth token', data: {code: 'UNAUTHORIZED'}}),
        )
    })

    it('rejects with UNAUTHORIZED when the token is not valid', async () => {
        verify.mockResolvedValue(null)
        const socket = fakeSocket({token: TOKEN})

        await middleware(socket, next)

        expect(socket.data.user).toBeUndefined()
        expect(next).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({message: 'Invalid auth token', data: {code: 'UNAUTHORIZED'}}),
        )
    })

    it('rejects with FORBIDDEN a user the section is not for, and accepts its owner', async () => {
        const ownerOnly = buildSocketAuth(verify, (uid) => uid === 'owner-uid')
        verify.mockResolvedValue(USER)

        await ownerOnly(fakeSocket({token: TOKEN}), next)

        expect(next).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({message: 'Not allowed', data: {code: 'FORBIDDEN'}}),
        )

        next.mockClear()
        verify.mockResolvedValue({uid: 'owner-uid'})
        await ownerOnly(fakeSocket({token: TOKEN}), next)

        expect(next).toHaveBeenCalledExactlyOnceWith()
    })

    it('rejects with a generic error when verification fails unexpectedly', async () => {
        verify.mockRejectedValue(new Error('Firebase down'))
        vi.spyOn(console, 'error').mockImplementation(() => {})

        await middleware(fakeSocket({token: TOKEN}), next)

        expect(next).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({message: 'Internal server error', data: {code: 'INTERNAL_ERROR'}}),
        )
    })
})
