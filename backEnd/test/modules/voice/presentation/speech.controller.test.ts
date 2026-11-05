import { AddressInfo } from 'node:net'
import { Server } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import SynthesizeSpeechUseCase from '../../../../src/modules/voice/application/synthesize-speech.use-case.js'
import { MAX_SPEECH_CHARS } from '../../../../src/modules/voice/domain/speech.js'
import type { SpeechSynthesizer } from '../../../../src/modules/voice/domain/speech-synthesizer.port.js'
import SpeechController from '../../../../src/modules/voice/presentation/speech.controller.js'
import buildVoiceRoutes from '../../../../src/modules/voice/presentation/voice.routes.js'
import type { TokenVerifier } from '../../../../src/shared/auth/token-verifier.js'
import { buildRequireAuth } from '../../../../src/shared/http/middlewares/auth.middleware.js'
import errorHandler from '../../../../src/shared/http/middlewares/error.middleware.js'

// Routes, auth and status codes through a real Express app on a random local
// port, with the real use case over a fake synthesizer. Each token is the uid
// it belongs to ('uid-1' signs in as uid-1).
const verify: TokenVerifier = async (token) => token.startsWith('uid-') ? {uid: token} : null

const AUDIO = new Uint8Array([1, 2, 3])

describe('voice speech route', () => {
    let server: Server
    let url: string
    const synthesize = vi.fn<SpeechSynthesizer['synthesize']>()

    beforeEach(async () => {
        synthesize.mockReset()
        synthesize.mockResolvedValue({audio: AUDIO, contentType: 'audio/mpeg'})
        const controller = new SpeechController(new SynthesizeSpeechUseCase({synthesize}))
        const app = express()
        app.use(express.json())
        const noLimit: express.RequestHandler = (_req, _res, next) => next()
        app.use('/voice', buildVoiceRoutes(buildRequireAuth(verify), noLimit, controller))
        app.use(errorHandler)

        server = app.listen(0)
        await new Promise((resolve) => server.once('listening', resolve))
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/voice/speech`
    })

    afterEach(() => {
        server.close()
    })

    const post = (body: unknown, token = 'uid-1') => fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify(body),
    })

    it('answers with the audio of the trimmed text', async () => {
        const response = await post({text: '  Hola, Martín.  '})

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toBe('audio/mpeg')
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(AUDIO)
        expect(synthesize).toHaveBeenCalledWith('Hola, Martín.', expect.any(AbortSignal))
    })

    it('rejects requests without a valid token', async () => {
        const response = await post({text: 'Hola'}, 'nope')

        expect(response.status).toBe(401)
        expect(synthesize).not.toHaveBeenCalled()
    })

    it.each([
        ['empty', {text: '   '}],
        ['too long', {text: 'a'.repeat(MAX_SPEECH_CHARS + 1)}],
        ['missing', {}],
    ])('rejects %s text without calling the synthesizer', async (_case, body) => {
        const response = await post(body)

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({error: {code: 'INVALID_TEXT', message: `Text must have 1 to ${MAX_SPEECH_CHARS} characters`}})
        expect(synthesize).not.toHaveBeenCalled()
    })

    it('answers 500 without details when the synthesizer fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        synthesize.mockRejectedValue(new Error('polly down'))

        const response = await post({text: 'Hola'})

        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({error: {code: 'INTERNAL_ERROR', message: 'Internal server error'}})
    })

    it('stops waiting for the audio when the client hangs up', async () => {
        let aborted: Promise<void> = Promise.resolve()
        synthesize.mockImplementation((_text, signal) => {
            aborted = new Promise((resolve) => signal.addEventListener('abort', () => resolve()))
            return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)))
        })
        const client = new AbortController()

        const request = fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', Authorization: 'Bearer uid-1'},
            body: JSON.stringify({text: 'Hola'}),
            signal: client.signal,
        })
        await vi.waitFor(() => expect(synthesize).toHaveBeenCalled())
        client.abort()

        await expect(request).rejects.toThrow()
        await aborted
    })
})
