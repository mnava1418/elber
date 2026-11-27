// A mockSocket socket: records what the client emits and lets the test play the server.
type Handler = (...args: unknown[]) => void
const mockSocket = {
  handlers: new Map<string, Handler>(),
  emitted: [] as { event: string; payload?: unknown }[],
  connect: jest.fn(),
  disconnect: jest.fn(),
  on(event: string, handler: Handler) {
    this.handlers.set(event, handler)
  },
  emit(event: string, payload?: unknown) {
    this.emitted.push({ event, payload })
  },
  server(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.(...args)
  },
}

jest.mock('../../src/lib/socket', () => ({ createChatSocket: () => mockSocket }))
jest.mock('../../src/chat/location', () => ({ currentLocation: () => Promise.resolve({ error: 'UNAVAILABLE' }) }))

import { socketIoTransport } from '../../src/chat/transport'
import type { ServerEvent } from '../../src/chat/types'

function open() {
  mockSocket.handlers.clear()
  mockSocket.emitted = []
  const events: ServerEvent[] = []
  const closes: string[] = []
  const conn = socketIoTransport('/chat')({
    onOpen: () => {},
    onClose: (reason) => closes.push(reason),
    onEvent: (e) => events.push(e),
  })
  return { conn, events, closes }
}

describe('socketIoTransport', () => {
  it('sends a message and passes on its answer for that turn', () => {
    const { conn, events } = open()
    conn.send('t1', 'hola')
    expect(mockSocket.emitted).toEqual([{ event: 'chat:message', payload: { text: 'hola', conversationId: undefined, voice: undefined } }])

    mockSocket.server('chat:conversation', { id: 'c1', title: 'Hola' })
    mockSocket.server('chat:tool', { name: 'WebFetch', detail: 'https://www.ejemplo.com/a' })
    mockSocket.server('chat:delta', { text: 'Ho' })
    mockSocket.server('chat:done', { cancelled: false })

    expect(events).toEqual([
      { type: 'conversation', turnId: 't1', id: 'c1', title: 'Hola' },
      { type: 'tool_start', turnId: 't1', step: { id: 'step-1', kind: 'read', detail: 'ejemplo.com' } },
      { type: 'tool_end', turnId: 't1', stepId: 'step-1' },
      { type: 'delta', turnId: 't1', text: 'Ho' },
      { type: 'done', turnId: 't1' },
    ])
  })

  it('drops what a stopped answer still sends and queues the next message until it ends', () => {
    const { conn, events } = open()
    conn.send('t1', 'uno')
    conn.stop('t1')
    expect(mockSocket.emitted.at(-1)).toEqual({ event: 'chat:cancel', payload: undefined })

    conn.send('t2', 'dos', 'c1')
    mockSocket.server('chat:delta', { text: 'tarde' })
    // Still draining: the second message waits.
    expect(mockSocket.emitted.filter((e) => e.event === 'chat:message')).toHaveLength(1)

    mockSocket.server('chat:done', { cancelled: true })
    expect(mockSocket.emitted.at(-1)).toEqual({ event: 'chat:message', payload: { text: 'dos', conversationId: 'c1', voice: undefined } })
    expect(events).toEqual([])
  })

  it('reports the rate limit with its wait', () => {
    const { conn, events } = open()
    conn.send('t1', 'hola')
    mockSocket.server('chat:error', { code: 'RATE_LIMITED', message: 'Espera', retryAfter: 120 })
    expect(events).toEqual([{ type: 'error', turnId: 't1', message: 'Espera', rateLimited: { retryAfter: 120 } }])
  })

  it('tells an invalid session and a forbidden section apart from a temporary failure', () => {
    const { closes } = open()
    mockSocket.server('connect_error', { data: { code: 'UNAUTHORIZED' } })
    mockSocket.server('connect_error', { data: { code: 'FORBIDDEN' } })
    mockSocket.server('connect_error', new Error('timeout'))
    expect(closes).toEqual(['rejected', 'forbidden', 'temporary'])
  })

  it('answers the location request even without a turn', async () => {
    open()
    const ack = jest.fn()
    mockSocket.server('chat:location', ack)
    await Promise.resolve()
    expect(ack).toHaveBeenCalledWith({ error: 'UNAVAILABLE' })
  })
})
