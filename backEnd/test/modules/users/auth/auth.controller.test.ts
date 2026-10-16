import { AddressInfo } from 'node:net'
import { Server } from 'node:http'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import AuthController from '../../../../src/modules/users/auth/auth.controller.js'
import AuthService from '../../../../src/modules/users/auth/auth.service.js'
import buildAuthRoutes from '../../../../src/modules/users/auth/auth.routes.js'
import errorHandler from '../../../../src/shared/http/middlewares/error.middleware.js'

// Exercises routing, body validation and HTTP status codes through a real
// Express app on a random local port. The service is a fake: no Firebase.
const requestPasswordReset = vi.fn<AuthService['requestPasswordReset']>()
const fakeService = {requestPasswordReset} as unknown as AuthService

const OK_BODY = {response: 'If the email is registered, it will receive a link to reset the password'}

describe('POST /auth/password-reset', () => {
    let server: Server
    let url: string

    beforeAll(async () => {
        const app = express()
        app.use(express.json())
        app.use('/auth', buildAuthRoutes(new AuthController(fakeService)))
        app.use(errorHandler)

        server = app.listen(0)
        await new Promise((resolve) => server.once('listening', resolve))
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/auth/password-reset`
    })

    afterAll(() => {
        server.close()
    })

    beforeEach(() => {
        vi.resetAllMocks()
        requestPasswordReset.mockResolvedValue()
    })

    const post = async (body: string) => {
        const response = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body})
        return {status: response.status, body: await response.json()}
    }

    it('answers 200 and calls the service with the email', async () => {
        const response = await post(JSON.stringify({email: 'user@example.com'}))

        expect(response).toEqual({status: 200, body: OK_BODY})
        expect(requestPasswordReset).toHaveBeenCalledExactlyOnceWith('user@example.com')
    })

    it('trims and lowercases the email before using it', async () => {
        await post(JSON.stringify({email: '  User@Example.COM '}))

        expect(requestPasswordReset).toHaveBeenCalledExactlyOnceWith('user@example.com')
    })

    it.each([
        ['an invalid email', {email: 'not-an-email'}],
        ['an empty email', {email: ''}],
        ['a missing email', {}],
        ['an email that is not a string', {email: 123}],
    ])('answers 400 INVALID_EMAIL for %s', async (_case, body) => {
        const response = await post(JSON.stringify(body))

        expect(response).toEqual({
            status: 400,
            body: {error: {code: 'INVALID_EMAIL', message: 'A valid email is required'}},
        })
        expect(requestPasswordReset).not.toHaveBeenCalled()
    })

    it('answers 400 for malformed JSON', async () => {
        const response = await post('{"email": ')

        expect(response.status).toBe(400)
        expect(requestPasswordReset).not.toHaveBeenCalled()
    })

    it('answers a generic 500 when the service fails unexpectedly', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        requestPasswordReset.mockRejectedValue(new Error('firebase down'))

        const response = await post(JSON.stringify({email: 'user@example.com'}))

        expect(response).toEqual({
            status: 500,
            body: {error: {code: 'INTERNAL_ERROR', message: 'Internal server error'}},
        })
    })
})
