// The browser's speech recognition (Web Speech API). TypeScript's DOM types
// have its events but not the class itself, which Chrome and Safari still
// prefix as webkitSpeechRecognition.
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onaudiostart: (() => void) | null
  start(): void
  abort(): void
}

type RecognitionClass = new () => Recognition

const Recognition = ((window as unknown as Record<string, unknown>).SpeechRecognition ??
  (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as RecognitionClass | undefined

/** Firefox, for one, can't listen. */
export const canListen = Boolean(Recognition)

export type ListenError = 'denied' | 'network'

interface Handlers {
  /** The microphone is really capturing: words said before this are lost. */
  onReady: () => void
  /** What it understands so far, while the user speaks. */
  onInterim: (text: string) => void
  /** The user finished a sentence. */
  onFinal: (text: string) => void
  /** It stopped without hearing anything (silence). */
  onSilence: () => void
  onError: (error: ListenError) => void
}

/**
 * Listens for one utterance: the browser decides when the user stopped
 * talking. Returns a function that stops listening without calling any handler.
 */
export function listenOnce({ onReady, onInterim, onFinal, onSilence, onError }: Handlers): () => void {
  if (!Recognition) {
    onError('denied')
    return () => {}
  }
  const recognition = new Recognition()
  recognition.lang = 'es-MX'
  recognition.continuous = false
  recognition.interimResults = true

  let heard = ''
  let failed = false
  recognition.onaudiostart = onReady
  recognition.onresult = (event) => {
    heard = Array.from(event.results, (result) => result[0]?.transcript ?? '').join('')
    onInterim(heard)
  }
  recognition.onerror = (event) => {
    // 'no-speech' and 'aborted' just end: onend follows.
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      failed = true
      onError('denied')
    } else if (event.error === 'network') {
      failed = true
      onError('network')
    }
  }
  recognition.onend = () => {
    if (failed) return
    const text = heard.trim()
    if (text) onFinal(text)
    else onSilence()
  }
  recognition.start()

  return () => {
    recognition.onaudiostart = null
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition.abort()
  }
}
