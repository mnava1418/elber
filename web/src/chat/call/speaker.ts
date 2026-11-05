import { apiPostAuthBlob } from '../../lib/api'

interface Handlers {
  /** A piece started playing. */
  onStart: () => void
  /** Nothing left to play (more may come later). */
  onIdle: () => void
  /** A piece couldn't be turned into audio (no AWS keys, server down…). */
  onError: () => void
}

/**
 * Elber's voice: plays pieces of text in order, with Polly's audio from the
 * backend. Each piece is fetched as soon as it arrives, so the next one is
 * usually ready when the current one ends.
 */
export class Speaker {
  private readonly audio = new Audio()
  private queue: Promise<Blob | null>[] = []
  private playing = false
  private controller = new AbortController()
  // Ends the wait for the current piece when the speaker is cleared.
  private finishPiece: (() => void) | null = null
  private readonly handlers: Handlers

  constructor(handlers: Handlers) {
    this.handlers = handlers
  }

  get busy() {
    return this.playing
  }

  say(text: string) {
    const signal = this.controller.signal
    this.queue.push(
      apiPostAuthBlob('/voice/speech', { text }, signal).catch(() => {
        if (!signal.aborted) this.handlers.onError()
        return null
      }),
    )
    if (!this.playing) void this.playNext()
  }

  /** Silence now: drops what is playing and what was waiting. */
  clear() {
    this.controller.abort()
    this.controller = new AbortController()
    this.queue = []
    this.audio.pause()
    this.playing = false
    this.finishPiece?.()
  }

  private async playNext(): Promise<void> {
    const next = this.queue.shift()
    if (!next) {
      this.playing = false
      this.handlers.onIdle()
      return
    }
    this.playing = true
    const signal = this.controller.signal
    const blob = await next
    if (signal.aborted) return
    if (blob) {
      const url = URL.createObjectURL(blob)
      this.audio.src = url
      await new Promise<void>((resolve) => {
        this.finishPiece = resolve
        this.audio.onended = () => resolve()
        this.audio.onerror = () => resolve()
        this.audio.play().then(this.handlers.onStart, () => resolve())
      })
      this.finishPiece = null
      URL.revokeObjectURL(url)
      if (signal.aborted) return
    }
    return this.playNext()
  }
}
