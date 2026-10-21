import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Connection, Transport } from './transport'
import { MAX_CHARS, type ConnectionState, type ElberTurn, type SendResult, type ServerEvent, type Turn } from './types'

const uid = () => crypto.randomUUID()
const isLive = (t: Turn): t is ElberTurn => t.role === 'elber' && (t.status === 'thinking' || t.status === 'streaming')
const finishSteps = (t: ElberTurn): ElberTurn => ({ ...t, steps: t.steps.map((s) => ({ ...s, status: 'done' })) })

/** `transport` debe ser estable (constante de módulo o useMemo). */
export function useChat(transport: Transport) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [retryIn, setRetryIn] = useState(0)
  const [attemptKey, setAttemptKey] = useState(0)
  const conn = useRef<Connection | null>(null)
  const attempt = useRef(0)
  // The conversation on screen, once the server has created it. In a ref, not
  // in the transport: it must outlive reconnections.
  const conversationId = useRef<string | null>(null)
  // The turn that started a new conversation, waiting for its id. A late id
  // from before a reset must not bring the old conversation back.
  const newConversationTurn = useRef<string | null>(null)

  const patch = useCallback((id: string, fn: (t: ElberTurn) => ElberTurn) => {
    setTurns((ts) => ts.map((t) => (t.id === id && t.role === 'elber' ? fn(t) : t)))
  }, [])

  const onEvent = useCallback(
    (e: ServerEvent) => {
      if (e.type === 'conversation') {
        if (e.turnId === newConversationTurn.current) {
          conversationId.current = e.id
          newConversationTurn.current = null
        }
        return
      }
      patch(e.turnId, (t) => {
        if (!isLive(t)) return t // ignora eventos tardíos de turnos detenidos o fallidos
        switch (e.type) {
          case 'tool_start':
            return { ...t, steps: [...t.steps, { ...e.step, status: 'running' }] }
          case 'tool_end':
            return { ...t, steps: t.steps.map((s) => (s.id === e.stepId ? { ...s, status: 'done' } : s)) }
          case 'delta':
            return { ...t, status: 'streaming', text: t.text + e.text }
          case 'sources':
            return { ...t, sources: e.sources }
          case 'done':
            return finishSteps({ ...t, status: 'done' })
          case 'error':
            return finishSteps({ ...t, status: 'error' })
        }
      })
    },
    [patch],
  )

  useEffect(() => {
    let retryTimer: number | undefined
    let tick: number | undefined
    const c = transport({
      onOpen: () => {
        attempt.current = 0
        setConnection('open')
      },
      onEvent,
      onClose: (reason) => {
        setTurns((ts) => ts.map((t) => (isLive(t) ? finishSteps({ ...t, status: 'error' }) : t)))
        if (reason === 'rejected') {
          setConnection('rejected')
          return
        }
        setConnection('reconnecting')
        const delay = Math.min(30, 2 * 2 ** attempt.current++)
        setRetryIn(delay)
        tick = window.setInterval(() => setRetryIn((s) => Math.max(0, s - 1)), 1000)
        retryTimer = window.setTimeout(() => setAttemptKey((k) => k + 1), delay * 1000)
      },
    })
    conn.current = c
    return () => {
      window.clearTimeout(retryTimer)
      window.clearInterval(tick)
      c.close()
    }
  }, [transport, onEvent, attemptKey])

  const liveTurn = useMemo(() => turns.find(isLive), [turns])
  const responding = Boolean(liveTurn)

  const send = useCallback(
    (raw: string): SendResult => {
      const text = raw.trim()
      if (!text) return 'empty'
      if (connection !== 'open') return 'offline'
      if (responding) return 'busy'
      if (text.length > MAX_CHARS) return 'too_long'
      const userId = uid()
      const elberId = uid()
      setTurns((ts) => [
        ...ts,
        { id: userId, role: 'user', text },
        { id: elberId, role: 'elber', replyTo: userId, status: 'thinking', text: '', steps: [], sources: [] },
      ])
      if (!conversationId.current) newConversationTurn.current = elberId
      conn.current?.send(elberId, text, conversationId.current ?? undefined)
      return 'sent'
    },
    [connection, responding],
  )

  const stop = useCallback(() => {
    if (!liveTurn) return
    conn.current?.stop(liveTurn.id)
    patch(liveTurn.id, (t) => finishSteps({ ...t, status: 'stopped' }))
  }, [liveTurn, patch])

  /**
   * Reintenta un turno con error o detenido. Solo el último: el servidor
   * recuerda la conversación y reenvía la pregunta al final.
   */
  const retry = useCallback(
    (elberId: string) => {
      if (connection !== 'open' || responding || turns.at(-1)?.id !== elberId) return
      const turn = turns.find((t): t is ElberTurn => t.id === elberId && t.role === 'elber')
      const question = turns.find((t) => t.id === turn?.replyTo)
      if (!turn || !question) return
      patch(elberId, (t) => ({ ...t, status: 'thinking', text: '', steps: [], sources: [] }))
      if (!conversationId.current) newConversationTurn.current = elberId
      conn.current?.send(elberId, question.text, conversationId.current ?? undefined)
    },
    [connection, responding, turns, patch],
  )

  const reconnectNow = useCallback(() => setAttemptKey((k) => k + 1), [])
  const reset = useCallback(() => {
    if (liveTurn) conn.current?.stop(liveTurn.id)
    conversationId.current = null
    newConversationTurn.current = null
    setTurns([])
  }, [liveTurn])

  return { turns, connection, retryIn, responding, send, stop, retry, reconnectNow, reset }
}
