import type { Speech } from './speech.js'

// Port: turns text into spoken audio. Amazon Polly is an adapter in
// infrastructure/ implementing it.
export interface SpeechSynthesizer {
    synthesize(text: string, signal: AbortSignal): Promise<Speech>
}
