import { createChatSocket } from '../lib/socket'
import { currentLocation } from './location'
import { toolDetail, toolKind } from './tools'
import type { ServerEvent, Source } from './types'

export interface TransportHandlers {
  onOpen(): void
  /** 'rejected' = invalid session; 'forbidden' = this section isn't for the user; 'temporary' = it retries on its own */
  onClose(reason: 'temporary' | 'rejected' | 'forbidden'): void
  onEvent(event: ServerEvent): void
}

export interface Connection {
  /** Without conversationId, the server starts a new conversation. `voice`: said in a call. */
  send(turnId: string, text: string, conversationId?: string, voice?: boolean): void
  /** Answers the conversation's last question again, replacing its failed or stopped answer. */
  retry(turnId: string, conversationId: string): void
  stop(turnId: string): void
  close(): void
}

export type Transport = (handlers: TransportHandlers) => Connection

// Copy of web/src/chat/transport.ts: change both together.

/**
 * Adapter to one of the backend's chat namespaces (Socket.IO): /chat, /diary... The backend has no
 * turn ids and answers one message at a time, so this keeps track of the
 * current turn and translates its events into the ServerEvents useChat expects.
 *
 * Each connection is a new socket: useChat decides when to reconnect (with
 * its own backoff and countdown), so Socket.IO's reconnection is off.
 */
export const socketIoTransport = (namespace: string): Transport => (h) => {
  const socket = createChatSocket(namespace, { reconnection: false })
  let closedByClient = false

  // The turn the backend is answering, and its tool step still running.
  let turnId: string | null = null
  let runningStep: string | null = null
  let stepCount = 0
  // After a stop, the backend still ends the cancelled answer with chat:done.
  // Until then, its late events are dropped and a new message waits.
  let draining = false
  let queued: { turnId: string; emit: () => void } | null = null

  const endStep = () => {
    if (turnId && runningStep) h.onEvent({ type: 'tool_end', turnId, stepId: runningStep })
    runningStep = null
  }

  // Starts a turn now, or after the cancelled answer ends.
  const start = (id: string, emit: () => void) => {
    if (draining) {
      queued = { turnId: id, emit }
      return
    }
    turnId = id
    runningStep = null
    emit()
  }

  // The answer ended (done, error or cancelled): flush a message sent meanwhile.
  const finishTurn = () => {
    turnId = null
    runningStep = null
    draining = false
    if (queued) {
      const next = queued
      queued = null
      start(next.turnId, next.emit)
    }
  }

  socket.on('connect', () => h.onOpen())
  socket.on('connect_error', (err) => {
    const code = (err as { data?: { code?: string } }).data?.code
    h.onClose(code === 'UNAUTHORIZED' ? 'rejected' : code === 'FORBIDDEN' ? 'forbidden' : 'temporary')
  })
  socket.on('disconnect', () => {
    if (closedByClient) return
    turnId = null
    draining = false
    queued = null
    h.onClose('temporary')
  })

  // Passed on even after a stop: the conversation exists and the next message continues it.
  socket.on('chat:conversation', ({ id, title }) => {
    if (turnId) h.onEvent({ type: 'conversation', turnId, id, title })
  })
  socket.on('chat:tool', ({ name, detail }) => {
    if (draining || !turnId) return
    endStep()
    const kind = toolKind(name)
    runningStep = `step-${++stepCount}`
    h.onEvent({ type: 'tool_start', turnId, step: { id: runningStep, kind, detail: toolDetail(kind, detail) } })
  })
  socket.on('chat:delta', ({ text }) => {
    if (draining || !turnId) return
    endStep()
    h.onEvent({ type: 'delta', turnId, text })
  })
  socket.on('chat:sources', ({ sources }) => {
    if (draining || !turnId) return
    h.onEvent({ type: 'sources', turnId, sources })
  })
  // Even while draining: the backend is waiting for it either way.
  socket.on('chat:location', (ack) => {
    void currentLocation().then(ack)
  })
  socket.on('chat:widget', ({ widget }) => {
    if (draining || !turnId) return
    h.onEvent({ type: 'widget', turnId, widget })
  })
  socket.on('chat:done', () => {
    if (!draining && turnId) h.onEvent({ type: 'done', turnId })
    finishTurn()
  })
  socket.on('chat:error', ({ code, message, retryAfter }) => {
    const rateLimited = code === 'RATE_LIMITED' ? { retryAfter: retryAfter ?? 60 } : undefined
    if (!draining && turnId) h.onEvent({ type: 'error', turnId, message, rateLimited })
    finishTurn()
  })

  socket.connect()

  return {
    send(id, text, conversationId, voice) {
      start(id, () => socket.emit('chat:message', { text, conversationId, voice }))
    },
    retry(id, conversationId) {
      start(id, () => socket.emit('chat:retry', { conversationId }))
    },
    stop(id) {
      if (id !== turnId || draining) return
      draining = true
      socket.emit('chat:cancel')
    },
    close() {
      closedByClient = true
      socket.disconnect()
    },
  }
}

const DEMO_SOURCES: Source[] = [
  { n: 1, url: 'https://smn.conagua.gob.mx', title: 'Pronóstico extendido por ciudad' },
  { n: 2, url: 'https://www.meteored.mx', title: 'El tiempo en Ciudad de México a 14 días' },
]

const DEMO_TEXT = `Este fin de semana en la Ciudad de México se espera clima templado, con **lluvia por la tarde el sábado** [1]. El domingo será más seco y soleado [2].

### Pronóstico

| Día | Máx | Mín | Lluvia |
| --- | ---: | ---: | ---: |
| Sábado | 23 °C | 12 °C | 70 % |
| Domingo | 25 °C | 11 °C | 20 % |

- Lleva **paraguas** si sales el sábado después de las 15:00.
- El domingo es buen día para actividades al aire libre.

Puedes consultarlo con la API de [Open-Meteo](https://open-meteo.com), ajustando \`latitude\` y \`longitude\`:

\`\`\`python
import requests

params = {"latitude": 19.43, "longitude": -99.13, "daily": "temperature_2m_max"}
r = requests.get("https://api.open-meteo.com/v1/forecast", params=params)
print(r.json()["daily"])
\`\`\``

/** Fake transport to work on the UI without the backend (VITE_CHAT_MOCK=true): always answers with the same demo. */
export const mockTransport: Transport = (h) => {
  const timers = new Map<string, ReturnType<typeof setTimeout>[]>()
  const open = setTimeout(() => h.onOpen(), 600)

  const schedule = (turnId: string, ms: number, fn: () => void) => {
    const list = timers.get(turnId) ?? []
    list.push(setTimeout(fn, ms))
    timers.set(turnId, list)
  }
  const clear = (turnId: string) => {
    timers.get(turnId)?.forEach((t) => clearTimeout(t))
    timers.delete(turnId)
  }

  // Every message (and retry) gets the same demo answer.
  const answer = (turnId: string) => {
    let t = 700
    schedule(turnId, t, () => h.onEvent({ type: 'tool_start', turnId, step: { id: 's1', kind: 'search', detail: 'clima en CDMX fin de semana' } }))
    schedule(turnId, (t += 1100), () => h.onEvent({ type: 'tool_end', turnId, stepId: 's1' }))
    schedule(turnId, t, () => h.onEvent({ type: 'tool_start', turnId, step: { id: 's2', kind: 'read', detail: 'smn.conagua.gob.mx' } }))
    schedule(turnId, (t += 1200), () => h.onEvent({ type: 'tool_end', turnId, stepId: 's2' }))
    schedule(turnId, t, () => h.onEvent({ type: 'sources', turnId, sources: DEMO_SOURCES }))
    for (const chunk of DEMO_TEXT.match(/\S+\s*/g) ?? []) {
      schedule(turnId, (t += 35), () => h.onEvent({ type: 'delta', turnId, text: chunk }))
    }
    schedule(turnId, (t += 100), () => h.onEvent({ type: 'done', turnId }))
  }

  return {
    send: answer,
    retry: answer,
    stop: clear,
    close() {
      clearTimeout(open)
      for (const id of timers.keys()) clear(id)
    },
  }
}
