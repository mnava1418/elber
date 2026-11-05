import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Connection, Transport } from './transport'
import { MAX_CHARS, type ConnectionState, type ElberTurn, type SendResult, type ServerEvent, type Turn } from './types'

const uid = () => crypto.randomUUID()
const isLive = (t: Turn): t is ElberTurn => t.role === 'elber' && (t.status === 'thinking' || t.status === 'streaming')
const finishSteps = (t: ElberTurn): ElberTurn => ({ ...t, steps: t.steps.map((s) => ({ ...s, status: 'done' })) })

interface Options {
  /** The server created the conversation for the first message. */
  onConversation?: (id: string, title: string) => void
}

/** `transport` must be stable (a module constant or useMemo). */
export function useChat(transport: Transport, { onConversation }: Options = {}) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [retryIn, setRetryIn] = useState(0)
  const [attemptKey, setAttemptKey] = useState(0)
  const conn = useRef<Connection | null>(null)
  const attempt = useRef(0)
  // The conversation on screen, once the server has created it. In a ref, not
  // in the transport: it must outlive reconnections.
  const conversationId = useRef<string | null>(null)
  // The same, for rendering.
  const [conversation, setConversation] = useState<string | null>(null)
  // The turn that started a new conversation, waiting for its id. A late id
  // from before a reset must not bring the old conversation back.
  const newConversationTurn = useRef<string | null>(null)
  // The turn whose question is on its way as a new message (not a retry), and
  // the turns whose question never got stored because of the rate limit:
  // retrying those sends the question again.
  const sentAsMessage = useRef<string | null>(null)
  const unsent = useRef(new Set<string>())
  // Latest callback, without re-subscribing to the transport when it changes.
  const onConversationRef = useRef(onConversation)
  useEffect(() => {
    onConversationRef.current = onConversation
  })

  const patch = useCallback((id: string, fn: (t: ElberTurn) => ElberTurn) => {
    setTurns((ts) => ts.map((t) => (t.id === id && t.role === 'elber' ? fn(t) : t)))
  }, [])

  const onEvent = useCallback(
    (e: ServerEvent) => {
      if (e.type === 'conversation') {
        if (e.turnId === newConversationTurn.current) {
          conversationId.current = e.id
          newConversationTurn.current = null
          setConversation(e.id)
          onConversationRef.current?.(e.id, e.title)
        }
        return
      }
      patch(e.turnId, (t) => {
        if (!isLive(t)) return t // ignore late events from stopped or failed turns
        switch (e.type) {
          case 'tool_start':
            return { ...t, steps: [...t.steps, { ...e.step, status: 'running' }] }
          case 'tool_end':
            return { ...t, steps: t.steps.map((s) => (s.id === e.stepId ? { ...s, status: 'done' } : s)) }
          case 'delta':
            return { ...t, status: 'streaming', text: t.text + e.text }
          case 'sources':
            return { ...t, sources: e.sources }
          case 'widget':
            return { ...t, widgets: [...t.widgets, e.widget] }
          case 'done':
            return finishSteps({ ...t, status: 'done' })
          case 'error':
            if (e.rateLimited && e.turnId === sentAsMessage.current) unsent.current.add(e.turnId)
            return finishSteps({ ...t, status: 'error', retryAfter: e.rateLimited?.retryAfter })
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
        // Neither gets better by retrying.
        if (reason === 'rejected' || reason === 'forbidden') {
          setConnection(reason)
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
  // For reset, which must stay stable: the page calls it from effects.
  const liveTurnId = useRef<string | undefined>(undefined)
  useEffect(() => {
    liveTurnId.current = liveTurn?.id
  })

  /** `voice`: said in a call, so Elber answers to be heard. */
  const send = useCallback(
    (raw: string, { voice = false } = {}): SendResult => {
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
        { id: elberId, role: 'elber', replyTo: userId, status: 'thinking', text: '', steps: [], sources: [], widgets: [] },
      ])
      if (!conversationId.current) newConversationTurn.current = elberId
      sentAsMessage.current = elberId
      conn.current?.send(elberId, text, conversationId.current ?? undefined, voice)
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
   * Retries a failed or stopped turn. Only the last one: the server
   * replaces that answer without storing the question again. If the
   * conversation doesn't exist yet (creating it failed) or the question
   * wasn't stored (rate limit), the question goes as a new message.
   */
  const retry = useCallback(
    (elberId: string) => {
      if (connection !== 'open' || responding || turns.at(-1)?.id !== elberId) return
      const turn = turns.find((t): t is ElberTurn => t.id === elberId && t.role === 'elber')
      const question = turns.find((t) => t.id === turn?.replyTo)
      if (!turn || !question) return
      patch(elberId, (t) => ({ ...t, status: 'thinking', text: '', steps: [], sources: [], widgets: [], retryAfter: undefined }))
      if (conversationId.current && !unsent.current.has(elberId)) {
        sentAsMessage.current = null
        conn.current?.retry(elberId, conversationId.current)
      } else {
        unsent.current.delete(elberId)
        if (!conversationId.current) newConversationTurn.current = elberId
        sentAsMessage.current = elberId
        conn.current?.send(elberId, question.text, conversationId.current ?? undefined)
      }
    },
    [connection, responding, turns, patch],
  )

  const reconnectNow = useCallback(() => setAttemptKey((k) => k + 1), [])
  const reset = useCallback(() => {
    if (liveTurnId.current) conn.current?.stop(liveTurnId.current)
    conversationId.current = null
    newConversationTurn.current = null
    unsent.current.clear()
    setConversation(null)
    setTurns([])
  }, [])

  /** Shows a saved conversation; new messages continue it. */
  const show = useCallback((id: string, saved: Turn[]) => {
    conversationId.current = id
    newConversationTurn.current = null
    unsent.current.clear()
    setConversation(id)
    setTurns(saved)
  }, [])

  /**
   * The conversation on screen, or null if it doesn't exist on the server yet.
   * Up to date at once, for effects and handlers; `conversation` is the same, for rendering.
   */
  const currentConversation = useCallback(() => conversationId.current, [])

  return { turns, conversation, connection, retryIn, responding, send, stop, retry, reconnectNow, reset, show, currentConversation }
}
