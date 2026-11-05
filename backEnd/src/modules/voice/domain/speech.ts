// Spoken audio of a piece of text.
export interface Speech {
    audio: Uint8Array
    // MIME type of the audio, e.g. "audio/mpeg".
    contentType: string
}

// The web asks for one sentence (or a few) at a time, so it can start
// talking before the answer is finished. The cap keeps a bug in the web
// from turning into a big bill: Polly charges per character.
export const MAX_SPEECH_CHARS = 1000
