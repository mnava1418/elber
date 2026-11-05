import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConnectionState, SendResult, Turn } from '../types'
import { chime } from './chime'
import { canListen, listenOnce, type ListenError } from './listener'
import { SentenceSplitter } from './sentences'
import { Speaker } from './speaker'

// Half duplex, like a walkie-talkie: while Elber thinks or talks the
// microphone is off, so it never hears (and answers) itself.
export type CallPhase = 'off' | 'listening' | 'thinking' | 'speaking'

const PROBLEMS: Record<ListenError | 'voice' | 'unsupported' | 'offline', string> = {
  unsupported: 'Tu navegador no puede escucharte. Usa Chrome o Safari.',
  denied: 'No tengo permiso para usar el micrófono.',
  network: 'No pude entenderte: el reconocimiento de voz no tiene conexión.',
  voice: 'No pude generar la voz de Elber. Su respuesta sigue en el chat.',
  offline: 'Se cortó la llamada: Elber perdió la conexión.',
}

const SORRY = 'Perdón, algo falló. ¿Me lo repites?'

interface Options {
  turns: Turn[]
  connection: ConnectionState
  send: (text: string) => SendResult
  /** Stops the answer in progress. */
  stop: () => void
}

/**
 * A call with Elber on top of the chat: what the user says goes as a normal
 * message, and every answer that starts during the call is read aloud, a
 * sentence at a time, as it streams in.
 */
export function useCall({ turns, connection, send, stop }: Options) {
  const [phase, setPhase] = useState<CallPhase>('off')
  // What the browser understands while the user speaks.
  const [heard, setHeard] = useState('')
  // Listening starts a moment after it's asked for; until then the user waits.
  const [ready, setReady] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const phaseRef = useRef<CallPhase>('off')
  const stopListening = useRef<(() => void) | null>(null)
  // Open for the whole call. Each turn's recognition then starts on a warm
  // microphone (hardware on, gain settled) instead of clipping the first words.
  const mic = useRef<MediaStream | null>(null)
  const speaker = useRef<Speaker | null>(null)
  // Answers that aren't read aloud: those from before the call and the interrupted ones.
  const silenced = useRef(new Set<string>())
  // The answer being read and how much of it was handed to the speaker.
  const current = useRef<{ id: string; splitter: SentenceSplitter; done: boolean } | null>(null)
  // Latest send, for the recognition's callbacks.
  const sendRef = useRef(send)
  useEffect(() => {
    sendRef.current = send
  })

  const move = useCallback((next: CallPhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const releaseMic = useCallback(() => {
    mic.current?.getTracks().forEach((track) => track.stop())
    mic.current = null
  }, [])

  const hangUp = useCallback(
    (reason?: keyof typeof PROBLEMS) => {
      stopListening.current?.()
      stopListening.current = null
      releaseMic()
      speaker.current?.clear()
      current.current = null
      setHeard('')
      setProblem(reason ? PROBLEMS[reason] : null)
      move('off')
    },
    [move, releaseMic],
  )

  // Named, so it can start over from its own callbacks.
  const listen = useCallback(function listenAgain() {
    stopListening.current?.()
    setHeard('')
    setReady(false)
    move('listening')
    stopListening.current = listenOnce({
      onReady: () => {
        setReady(true)
        chime()
      },
      onInterim: setHeard,
      onFinal: (text) => {
        stopListening.current = null
        const result = sendRef.current(text)
        // Busy: a typed message got there first; its answer is read instead.
        if (result === 'sent' || result === 'busy') move('thinking')
        else listenAgain()
      },
      // Nothing heard: keep listening, a call doesn't time out.
      onSilence: () => {
        stopListening.current = null
        if (phaseRef.current === 'listening') listenAgain()
      },
      onError: (error) => hangUp(error),
    })
  }, [move, hangUp])

  // The speaker ran out of text: back to listening if the answer is over.
  const onIdle = useCallback(() => {
    if (phaseRef.current === 'off') return
    if (current.current?.done) listen()
    else move('thinking')
  }, [listen, move])

  const start = useCallback(() => {
    if (!canListen) {
      setProblem(PROBLEMS.unsupported)
      return
    }
    setProblem(null)
    silenced.current = new Set(turns.map((t) => t.id))
    current.current = null
    speaker.current?.clear()
    speaker.current = new Speaker({
      onStart: () => phaseRef.current !== 'off' && move('speaking'),
      onIdle: () => onIdle(),
      onError: () => setProblem(PROBLEMS.voice),
    })
    setReady(false)
    move('listening')
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Hung up while the browser asked for permission.
        if (phaseRef.current === 'off') {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        releaseMic()
        mic.current = stream
        listen()
      })
      .catch(() => hangUp('denied'))
  }, [turns, listen, move, onIdle, releaseMic, hangUp])

  /** Cuts Elber off: stops its voice and its answer, and listens again. */
  const interrupt = useCallback(() => {
    if (current.current) silenced.current.add(current.current.id)
    current.current = null
    speaker.current?.clear()
    stop()
    listen()
  }, [stop, listen])

  // Reads the answers aloud as they stream in.
  useEffect(() => {
    if (phaseRef.current === 'off') return
    const turn = turns.at(-1)
    if (turn?.role !== 'elber' || silenced.current.has(turn.id)) return
    if (current.current?.id !== turn.id) {
      // A new answer, maybe from a typed message: stop listening for this one.
      current.current = { id: turn.id, splitter: new SentenceSplitter(), done: false }
      stopListening.current?.()
      stopListening.current = null
      if (phaseRef.current === 'listening') move('thinking')
    }
    const reading = current.current
    if (reading.done) return
    const done = turn.status !== 'thinking' && turn.status !== 'streaming'
    const pieces = turn.status === 'stopped' ? [] : reading.splitter.push(turn.text, done)
    if (turn.status === 'error' && !turn.text) pieces.push(SORRY)
    for (const piece of pieces) speaker.current?.say(piece)
    if (done) {
      reading.done = true
      if (!speaker.current?.busy) listen()
    }
  }, [turns, listen, move])

  // A notice, not a dialog: it goes away on its own.
  useEffect(() => {
    if (!problem) return
    const id = window.setTimeout(() => setProblem(null), 6000)
    return () => window.clearTimeout(id)
  }, [problem])

  // A call needs the chat: without it nothing would answer.
  useEffect(() => {
    if (connection !== 'open' && phaseRef.current !== 'off') hangUp('offline')
  }, [connection, hangUp])

  // Leaving the page hangs up.
  useEffect(
    () => () => {
      stopListening.current?.()
      speaker.current?.clear()
      releaseMic()
    },
    [releaseMic],
  )

  return { phase, ready, heard, problem, start, hangUp: () => hangUp(), interrupt }
}
