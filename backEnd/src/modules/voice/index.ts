import { PollyClient } from '@aws-sdk/client-polly'
import type { Router } from 'express'
import rateLimit from 'express-rate-limit'
import env from '../../config/env.js'
import { createFirebaseTokenVerifier } from '../../shared/auth/token-verifier.js'
import { firebaseAuth } from '../../shared/firebase/firebase-admin.js'
import { authUser, buildRequireAuth } from '../../shared/http/middlewares/auth.middleware.js'
import SynthesizeSpeechUseCase from './application/synthesize-speech.use-case.js'
import PollySpeechSynthesizer from './infrastructure/polly-speech-synthesizer.js'
import SpeechController from './presentation/speech.controller.js'
import buildVoiceRoutes from './presentation/voice.routes.js'

// Pieces of speech per user every 15 minutes. One spoken answer is several
// requests (a sentence or a few each), so this is well above the chat's limit
// of answers.
const SPEECH_LIMIT = 300
const SPEECH_WINDOW_MS = 15 * 60 * 1000

// Public entry point of the voice module: Elber's voice for calls. It isn't a
// skill (the agent never uses it): the web turns the answers into audio here.
export interface VoiceModule {
    router: Router
}

const createVoiceModule = (): VoiceModule => {
    const polly = new PollyClient({
        region: env.AWS_REGION,
        credentials: {accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY},
    })
    // To switch voice provider, swap this adapter for another SpeechSynthesizer.
    const synthesizeSpeech = new SynthesizeSpeechUseCase(new PollySpeechSynthesizer(polly, env.POLLY_VOICE))

    const limit = rateLimit({
        windowMs: SPEECH_WINDOW_MS,
        limit: SPEECH_LIMIT,
        keyGenerator: (_req, res) => authUser(res).uid,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {error: {code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again later'}},
    })

    return {
        router: buildVoiceRoutes(buildRequireAuth(createFirebaseTokenVerifier(firebaseAuth)), limit, new SpeechController(synthesizeSpeech)),
    }
}

export default createVoiceModule
