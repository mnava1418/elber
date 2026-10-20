import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Assistant, AssistantEvent, ReplyInput } from '../../../../src/modules/chat/domain/assistant.port.js'
import type { ChatSocket } from '../../../../src/modules/chat/presentation/chat.events.js'
import buildChatSocketHandler, { MAX_MESSAGE_LENGTH } from '../../../../src/modules/chat/presentation/chat-socket.handler.js'

// A socket whose incoming events we trigger by hand and whose outgoing
// events (emit) we record.
const fakeSocket = () => {
    const incoming = new EventEmitter()
    const emit = vi.fn()
    const socket = {
        on: (event: string, listener: (...args: unknown[]) => void) => incoming.on(event, listener),
        emit,
        data: {user: {uid: 'uid-1'}},
    } as unknown as ChatSocket
    // Runs the listener and waits for it: chat:message handlers are async.
    const receive = async (event: string, ...args: unknown[]) => {
        await Promise.all(incoming.listeners(event).map((listener) => listener(...args)))
    }
    return {socket, emit, receive}
}

// An assistant that answers with the given events.
const assistantAnswering = (...events: AssistantEvent[]): Assistant => ({
    async *reply() {
        yield* events
    },
})

describe('chat socket handler', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('streams the answer as chat:delta / chat:tool and ends with chat:done', async () => {
        const {socket, emit, receive} = fakeSocket()
        buildChatSocketHandler(assistantAnswering(
            {type: 'delta', text: 'Déjame buscar.'},
            {type: 'tool', name: 'WebSearch', detail: 'clima CDMX'},
            {type: 'delta', text: 'Hace sol.'},
        ))(socket)

        await receive('chat:message', {text: '¿Qué clima hace?'})

        expect(emit.mock.calls).toEqual([
            ['chat:delta', {text: 'Déjame buscar.'}],
            ['chat:tool', {name: 'WebSearch', detail: 'clima CDMX'}],
            ['chat:delta', {text: 'Hace sol.'}],
            ['chat:done', {cancelled: false}],
        ])
    })

    it('forwards sources as chat:sources', async () => {
        const {socket, emit, receive} = fakeSocket()
        const sources = [{n: 1, url: 'https://a.com', title: 'A'}]
        buildChatSocketHandler(assistantAnswering({type: 'sources', sources}))(socket)

        await receive('chat:message', {text: 'hola'})

        expect(emit.mock.calls).toEqual([
            ['chat:sources', {sources}],
            ['chat:done', {cancelled: false}],
        ])
    })

    it('sends the trimmed text to the assistant', async () => {
        const reply = vi.fn<Assistant['reply']>(async function* () {})
        const {socket, receive} = fakeSocket()
        buildChatSocketHandler({reply})(socket)

        await receive('chat:message', {text: '  hola  '})

        expect(reply).toHaveBeenCalledExactlyOnceWith({text: 'hola', signal: expect.any(AbortSignal)})
    })

    it.each([
        ['no payload', undefined],
        ['a text that is not a string', {text: 42}],
        ['an empty text', {text: '   '}],
        ['a text that is too long', {text: 'a'.repeat(MAX_MESSAGE_LENGTH + 1)}],
    ])('answers INVALID_MESSAGE to %s without calling the assistant', async (_case, payload) => {
        const reply = vi.fn<Assistant['reply']>()
        const {socket, emit, receive} = fakeSocket()
        buildChatSocketHandler({reply})(socket)

        await receive('chat:message', payload)

        expect(reply).not.toHaveBeenCalled()
        expect(emit).toHaveBeenCalledExactlyOnceWith('chat:error', expect.objectContaining({code: 'INVALID_MESSAGE'}))
    })

    it('answers BUSY to a message sent while another answer is in progress', async () => {
        let finish!: () => void
        const assistant: Assistant = {
            // An answer that only waits until the test lets it finish.
            // oxlint-disable-next-line require-yield
            async *reply() {
                await new Promise<void>((resolve) => { finish = resolve })
            },
        }
        const {socket, emit, receive} = fakeSocket()
        buildChatSocketHandler(assistant)(socket)

        const first = receive('chat:message', {text: 'uno'})
        await receive('chat:message', {text: 'dos'})
        finish()
        await first

        expect(emit.mock.calls).toEqual([
            ['chat:error', expect.objectContaining({code: 'BUSY'})],
            ['chat:done', {cancelled: false}],
        ])
    })

    it.each(['chat:cancel', 'disconnect'])('aborts the answer on %s and ends with chat:done cancelled', async (event) => {
        let signal!: AbortSignal
        const assistant: Assistant = {
            // An answer that only waits until it's aborted.
            // oxlint-disable-next-line require-yield
            async *reply(input: ReplyInput) {
                signal = input.signal
                await new Promise((_resolve, reject) => {
                    input.signal.addEventListener('abort', () => reject(new Error('aborted')))
                })
            },
        }
        const {socket, emit, receive} = fakeSocket()
        buildChatSocketHandler(assistant)(socket)

        const answering = receive('chat:message', {text: 'hola'})
        await receive(event)
        await answering

        expect(signal.aborted).toBe(true)
        expect(emit).toHaveBeenCalledExactlyOnceWith('chat:done', {cancelled: true})
    })

    it('answers a generic INTERNAL_ERROR when the assistant fails, and accepts new messages after', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const reply = vi.fn<Assistant['reply']>()
            // Fails before the first piece of text.
            // oxlint-disable-next-line require-yield
            .mockImplementationOnce(async function* () {
                throw new Error('API key invalid')
            })
            .mockImplementationOnce(async function* () {
                yield {type: 'delta', text: 'ok'}
            })
        const {socket, emit, receive} = fakeSocket()
        buildChatSocketHandler({reply})(socket)

        await receive('chat:message', {text: 'uno'})
        await receive('chat:message', {text: 'dos'})

        expect(emit.mock.calls).toEqual([
            ['chat:error', {code: 'INTERNAL_ERROR', message: 'Elber could not answer, try again'}],
            ['chat:delta', {text: 'ok'}],
            ['chat:done', {cancelled: false}],
        ])
    })
})
