import { SynthesizeSpeechCommand, type SynthesizeSpeechCommandOutput, type VoiceId } from '@aws-sdk/client-polly'
import type { Speech } from '../domain/speech.js'
import type { SpeechSynthesizer } from '../domain/speech-synthesizer.port.js'

const TIMEOUT_MS = 10_000

// The part of PollyClient used, so tests can fake it.
export interface PollySender {
    send(command: SynthesizeSpeechCommand, options: {abortSignal: AbortSignal}): Promise<SynthesizeSpeechCommandOutput>
}

// Adapter: Amazon Polly's neural voices.
// https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html
class PollySpeechSynthesizer implements SpeechSynthesizer {
    constructor(
        private readonly polly: PollySender,
        // e.g. "Mia" (Mexican Spanish). It must support the neural engine.
        private readonly voice: VoiceId,
    ) {}

    synthesize = async (text: string, signal: AbortSignal): Promise<Speech> => {
        const command = new SynthesizeSpeechCommand({
            Engine: 'neural',
            OutputFormat: 'mp3',
            VoiceId: this.voice,
            Text: text,
            TextType: 'text',
        })
        const response = await this.polly.send(command, {abortSignal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])})
        if (!response.AudioStream) throw new Error('Polly answered without audio')
        return {
            audio: await response.AudioStream.transformToByteArray(),
            contentType: response.ContentType ?? 'audio/mpeg',
        }
    }
}

export default PollySpeechSynthesizer
