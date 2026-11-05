import { describe, expect, it, vi } from 'vitest'
import type { SynthesizeSpeechCommandOutput } from '@aws-sdk/client-polly'
import PollySpeechSynthesizer, { type PollySender } from '../../../../src/modules/voice/infrastructure/polly-speech-synthesizer.js'

const AUDIO = new Uint8Array([1, 2, 3])

const output = (audio?: Uint8Array, contentType?: string) => ({
    AudioStream: audio ? {transformToByteArray: async () => audio} : undefined,
    ContentType: contentType,
    $metadata: {},
}) as unknown as SynthesizeSpeechCommandOutput

describe('PollySpeechSynthesizer', () => {
    const signal = new AbortController().signal

    it('asks Polly for neural mp3 audio with the configured voice', async () => {
        const send = vi.fn<PollySender['send']>().mockResolvedValue(output(AUDIO, 'audio/mpeg'))

        const speech = await new PollySpeechSynthesizer({send}, 'Mia').synthesize('Hola, ¿cómo estás?', signal)

        const [command, options] = send.mock.calls[0]!
        expect(command.input).toEqual({Engine: 'neural', OutputFormat: 'mp3', VoiceId: 'Mia', Text: 'Hola, ¿cómo estás?', TextType: 'text'})
        expect(options.abortSignal).toBeInstanceOf(AbortSignal)
        expect(speech).toEqual({audio: AUDIO, contentType: 'audio/mpeg'})
    })

    it('passes the abort on to Polly', async () => {
        const controller = new AbortController()
        const send = vi.fn<PollySender['send']>().mockResolvedValue(output(AUDIO))

        await new PollySpeechSynthesizer({send}, 'Mia').synthesize('Hola', controller.signal)
        controller.abort()

        expect(send.mock.calls[0]![1].abortSignal.aborted).toBe(true)
    })

    it('defaults to mp3 when Polly gives no content type', async () => {
        const send = vi.fn<PollySender['send']>().mockResolvedValue(output(AUDIO))

        const speech = await new PollySpeechSynthesizer({send}, 'Mia').synthesize('Hola', signal)

        expect(speech.contentType).toBe('audio/mpeg')
    })

    it('throws when Polly answers without audio', async () => {
        const send = vi.fn<PollySender['send']>().mockResolvedValue(output())

        await expect(new PollySpeechSynthesizer({send}, 'Mia').synthesize('Hola', signal)).rejects.toThrow('without audio')
    })
})
