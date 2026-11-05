import { RequestHandler, Router } from 'express'
import type SpeechController from './speech.controller.js'

// `rateLimit` runs after auth, so it can count per user.
const buildVoiceRoutes = (requireAuth: RequestHandler, rateLimit: RequestHandler, speech: SpeechController) => {
    const router = Router()
    router.use(requireAuth, rateLimit)

    router.post('/speech', speech.synthesize)

    return router
}

export default buildVoiceRoutes
