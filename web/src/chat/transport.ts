import { createChatSocket } from '../lib/socket'
import { toolDetail, toolKind } from './tools'
import type { ServerEvent, Source } from './types'

export interface TransportHandlers {
  onOpen(): void
  /** 'rejected' = sesión inválida; 'temporary' = se reintenta solo */
  onClose(reason: 'temporary' | 'rejected'): void
  onEvent(event: ServerEvent): void
}

export interface Connection {
  /** Sin conversationId, el servidor empieza una conversación nueva. */
  send(turnId: string, text: string, conversationId?: string): void
  stop(turnId: string): void
  close(): void
}

export type Transport = (handlers: TransportHandlers) => Connection

/**
 * Adapter to the backend's /chat namespace (Socket.IO). The backend has no
 * turn ids and answers one message at a time, so this keeps track of the
 * current turn and translates its events into the ServerEvents useChat expects.
 *
 * Each connection is a new socket: useChat decides when to reconnect (with
 * its own backoff and countdown), so Socket.IO's reconnection is off.
 */
export const socketIoTransport: Transport = (h) => {
  const socket = createChatSocket({ reconnection: false })
  let closedByClient = false

  // The turn the backend is answering, and its tool step still running.
  let turnId: string | null = null
  let runningStep: string | null = null
  let stepCount = 0
  // After a stop, the backend still ends the cancelled answer with chat:done.
  // Until then, its late events are dropped and a new message waits.
  let draining = false
  let queued: { turnId: string; text: string; conversationId?: string } | null = null

  const endStep = () => {
    if (turnId && runningStep) h.onEvent({ type: 'tool_end', turnId, stepId: runningStep })
    runningStep = null
  }

  const emitMessage = (id: string, text: string, conversationId?: string) => {
    turnId = id
    runningStep = null
    socket.emit('chat:message', { text, conversationId })
  }

  // The answer ended (done, error or cancelled): flush a message sent meanwhile.
  const finishTurn = () => {
    turnId = null
    runningStep = null
    draining = false
    if (queued) {
      const next = queued
      queued = null
      emitMessage(next.turnId, next.text, next.conversationId)
    }
  }

  socket.on('connect', () => h.onOpen())
  socket.on('connect_error', (err) => {
    const code = (err as { data?: { code?: string } }).data?.code
    h.onClose(code === 'UNAUTHORIZED' ? 'rejected' : 'temporary')
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
  socket.on('chat:done', () => {
    if (!draining && turnId) h.onEvent({ type: 'done', turnId })
    finishTurn()
  })
  socket.on('chat:error', ({ message }) => {
    if (!draining && turnId) h.onEvent({ type: 'error', turnId, message })
    finishTurn()
  })

  socket.connect()

  return {
    send(id, text, conversationId) {
      if (draining) {
        queued = { turnId: id, text, conversationId }
        return
      }
      emitMessage(id, text, conversationId)
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

/** Transporte simulado para trabajar la UI sin backend (VITE_CHAT_MOCK=true): responde siempre con la misma demo. */
export const mockTransport: Transport = (h) => {
  const timers = new Map<string, number[]>()
  const open = window.setTimeout(() => h.onOpen(), 600)

  const schedule = (turnId: string, ms: number, fn: () => void) => {
    const list = timers.get(turnId) ?? []
    list.push(window.setTimeout(fn, ms))
    timers.set(turnId, list)
  }
  const clear = (turnId: string) => {
    timers.get(turnId)?.forEach((t) => window.clearTimeout(t))
    timers.delete(turnId)
  }

  return {
    send(turnId) {
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
    },
    stop: clear,
    close() {
      window.clearTimeout(open)
      for (const id of timers.keys()) clear(id)
    },
  }
}
