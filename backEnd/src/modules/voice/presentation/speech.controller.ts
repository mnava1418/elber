import { Request, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from '../../../shared/http/errors.js'
import type SynthesizeSpeechUseCase from '../application/synthesize-speech.use-case.js'
import { MAX_SPEECH_CHARS } from '../domain/speech.js'

const speechSchema = z.object({
    text: z.string().trim().min(1).max(MAX_SPEECH_CHARS),
})

class SpeechController {
    constructor(private readonly synthesizeSpeechUseCase: SynthesizeSpeechUseCase) {}

    synthesize = async (req: Request, res: Response) => {
        const parsed = speechSchema.safeParse(req.body)
        if (!parsed.success) {
            throw new BadRequestError(`Text must have 1 to ${MAX_SPEECH_CHARS} characters`, 'INVALID_TEXT')
        }

        // When the web hangs up (the user interrupts Elber) the audio is no
        // longer wanted: stop waiting for it. After a normal answer this
        // aborts nothing.
        const controller = new AbortController()
        res.on('close', () => controller.abort())

        try {
            const speech = await this.synthesizeSpeechUseCase.execute(parsed.data.text, controller.signal)
            res.type(speech.contentType).send(Buffer.from(speech.audio))
        } catch (error) {
            // Nobody is left to answer.
            if (controller.signal.aborted) return
            throw error
        }
    }
}

export default SpeechController
