import type { SpeechSynthesizer } from '../domain/speech-synthesizer.port.js'

// Elber's voice during a call: the web sends the answer a sentence at a
// time and plays the audio back. The controller already validated the text.
class SynthesizeSpeechUseCase {
    constructor(private readonly synthesizer: SpeechSynthesizer) {}

    execute = (text: string, signal: AbortSignal) => this.synthesizer.synthesize(text, signal)
}

export default SynthesizeSpeechUseCase
