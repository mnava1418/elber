import { act, renderHook } from '@testing-library/react-native'
import type { Connection, Transport, TransportHandlers } from '../../src/chat/transport'
import { useChat } from '../../src/chat/useChat'

// A transport the test drives by hand. (Testing Library 14 renders and acts asynchronously.)
function fakeTransport() {
  const state: { handlers: TransportHandlers | null; sent: unknown[][]; retried: unknown[][]; stopped: string[] } = {
    handlers: null,
    sent: [],
    retried: [],
    stopped: [],
  }
  const transport: Transport = (handlers): Connection => {
    state.handlers = handlers
    return {
      send: (...args) => void state.sent.push(args),
      retry: (...args) => void state.retried.push(args),
      stop: (id) => void state.stopped.push(id),
      close: () => {},
    }
  }
  return { transport, state }
}

describe('useChat', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('waits for the connection, then streams an answer into a new conversation', async () => {
    const { transport, state } = fakeTransport()
    const { result } = await renderHook(() => useChat(transport))
    expect(result.current.send('hola')).toBe('offline')

    await act(() => state.handlers!.onOpen())
    let sent = ''
    await act(() => {
      sent = result.current.send('  hola  ')
    })
    expect(sent).toBe('sent')
    const [turnId, text, conversationId] = state.sent[0] as [string, string, string | undefined]
    expect(text).toBe('hola')
    expect(conversationId).toBeUndefined()
    expect(result.current.responding).toBe(true)

    await act(() => {
      state.handlers!.onEvent({ type: 'conversation', turnId, id: 'c1', title: 'Hola' })
      state.handlers!.onEvent({ type: 'delta', turnId, text: '¡Hola!' })
      state.handlers!.onEvent({ type: 'done', turnId })
    })
    expect(result.current.conversation).toBe('c1')
    expect(result.current.responding).toBe(false)
    expect(result.current.turns.at(-1)).toMatchObject({ role: 'elber', status: 'done', text: '¡Hola!' })

    // The next message continues the conversation.
    await act(() => {
      result.current.send('¿y mañana?')
    })
    expect((state.sent[1] as unknown[])[2]).toBe('c1')
  })

  it('refuses a second message while answering and one over the limit', async () => {
    const { transport, state } = fakeTransport()
    const { result } = await renderHook(() => useChat(transport))
    await act(() => state.handlers!.onOpen())
    await act(() => {
      result.current.send('uno')
    })
    expect(result.current.send('dos')).toBe('busy')
    expect(result.current.send('')).toBe('empty')
  })

  it('stops an answer, then retries it in the same conversation', async () => {
    const { transport, state } = fakeTransport()
    const { result } = await renderHook(() => useChat(transport))
    await act(() => state.handlers!.onOpen())
    await act(() => {
      result.current.show('c1', [])
    })
    await act(() => {
      result.current.send('hola')
    })
    const turnId = (state.sent[0] as string[])[0]
    await act(() => result.current.stop())
    expect(state.stopped).toEqual([turnId])
    expect(result.current.turns.at(-1)).toMatchObject({ status: 'stopped' })

    await act(() => result.current.retry(turnId))
    expect(state.retried).toEqual([[turnId, 'c1']])
    expect(result.current.turns.at(-1)).toMatchObject({ status: 'thinking', text: '' })
  })

  it('counts down and reconnects after a lost connection, failing the live answer', async () => {
    const { transport, state } = fakeTransport()
    const { result } = await renderHook(() => useChat(transport))
    await act(() => state.handlers!.onOpen())
    await act(() => {
      result.current.send('hola')
    })
    const first = state.handlers
    await act(() => first!.onClose('temporary'))
    expect(result.current.connection).toBe('reconnecting')
    expect(result.current.retryIn).toBe(2)
    expect(result.current.turns.at(-1)).toMatchObject({ status: 'error' })

    await act(() => jest.advanceTimersByTime(2000))
    // A new connection was made.
    expect(state.handlers).not.toBe(first)
  })

  it('does not retry an invalid session', async () => {
    const { transport, state } = fakeTransport()
    const { result } = await renderHook(() => useChat(transport))
    await act(() => state.handlers!.onClose('rejected'))
    expect(result.current.connection).toBe('rejected')
    expect(result.current.retryIn).toBe(0)
  })
})
