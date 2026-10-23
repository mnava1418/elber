import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SendMessageUseCase, { NothingToRetryError, type SendMessageEvent, type SendMessageInput } from '../../../../src/modules/chat/application/send-message.use-case.js'
import { ConversationNotFoundError } from '../../../../src/modules/chat/domain/conversation.js'
import type { ChatSocket } from '../../../../src/modules/chat/presentation/chat.events.js'
import buildChatSocketHandler, { LOCATION_TIMEOUT_MS, MAX_MESSAGE_LENGTH } from '../../../../src/modules/chat/presentation/chat-socket.handler.js'
import { createMessageRateLimit, type MessageRateLimit } from '../../../../src/modules/chat/presentation/message-rate-limit.js'

// A socket whose incoming events we trigger by hand and whose outgoing
// events (emit) we record.
const fakeSocket = () => {
    const incoming = new EventEmitter()
    const emit = vi.fn()
    // What the client answers to chat:location.
    const emitWithAck = vi.fn()
    const timeout = vi.fn(() => ({emitWithAck}))
    const socket = {
        on: (event: string, listener: (...args: unknown[]) => void) => incoming.on(event, listener),
        emit,
        timeout,
        disconnected: false,
        data: {user: {uid: 'uid-1'}},
    } as unknown as ChatSocket
    // Runs the listener and waits for it: chat:message handlers are async.
    const receive = async (event: string, ...args: unknown[]) => {
        await Promise.all(incoming.listeners(event).map((listener) => listener(...args)))
    }
    return {socket, emit, receive, timeout, emitWithAck}
}

// Only execute() and retry() are used by the handler; no assistant or storage behind it.
const fakeUseCase = (execute: SendMessageUseCase['execute'], retry: SendMessageUseCase['retry'] = execute as never) =>
    ({execute, retry}) as unknown as SendMessageUseCase

// Lets every answer through, unless a test passes its own limit.
const unlimited: MessageRateLimit = {take: () => 0}
const handle = (useCase: SendMessageUseCase, rateLimit = unlimited) => buildChatSocketHandler(useCase, rateLimit)

// A use case that answers with the given events.
const answering = (...events: SendMessageEvent[]) => fakeUseCase(async function* () {
    yield* events
})

describe('chat socket handler', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('streams the answer as chat:conversation / delta / tool / sources / widget and ends with chat:done', async () => {
        const sources = [{n: 1, url: 'https://a.com', title: 'A'}]
        const {socket, emit, receive} = fakeSocket()
        handle(answering(
            {type: 'conversation', id: 'conv1', title: '¿Qué clima hace?'},
            {type: 'delta', text: 'Déjame buscar.'},
            {type: 'tool', name: 'WebSearch', detail: 'clima CDMX'},
            {type: 'sources', sources},
            {type: 'widget', widget: {type: 'weather', data: {temp: 22}}},
            {type: 'delta', text: 'Hace sol [1].'},
        ))(socket)

        await receive('chat:message', {text: '¿Qué clima hace?'})

        expect(emit.mock.calls).toEqual([
            ['chat:conversation', {id: 'conv1', title: '¿Qué clima hace?'}],
            ['chat:delta', {text: 'Déjame buscar.'}],
            ['chat:tool', {name: 'WebSearch', detail: 'clima CDMX'}],
            ['chat:sources', {sources}],
            ['chat:widget', {widget: {type: 'weather', data: {temp: 22}}}],
            ['chat:delta', {text: 'Hace sol [1].'}],
            ['chat:done', {cancelled: false}],
        ])
    })

    it('runs the use case with the user, the trimmed text and the conversation', async () => {
        const execute = vi.fn<SendMessageUseCase['execute']>(async function* () {})
        const {socket, receive} = fakeSocket()
        handle(fakeUseCase(execute))(socket)

        await receive('chat:message', {text: '  hola  ', conversationId: 'conv1'})

        expect(execute).toHaveBeenCalledExactlyOnceWith({uid: 'uid-1', text: 'hola', conversationId: 'conv1', signal: expect.any(AbortSignal), locate: expect.any(Function)})
    })

    it.each([
        ['no payload', undefined],
        ['a text that is not a string', {text: 42}],
        ['an empty text', {text: '   '}],
        ['a text that is too long', {text: 'a'.repeat(MAX_MESSAGE_LENGTH + 1)}],
        ['a conversation id that is not a string', {text: 'hola', conversationId: 42}],
        ['a conversation id that could be a path', {text: 'hola', conversationId: '../otro/conv1'}],
    ])('answers INVALID_MESSAGE to %s without running the use case', async (_case, payload) => {
        const execute = vi.fn<SendMessageUseCase['execute']>()
        const {socket, emit, receive} = fakeSocket()
        handle(fakeUseCase(execute))(socket)

        await receive('chat:message', payload)

        expect(execute).not.toHaveBeenCalled()
        expect(emit).toHaveBeenCalledExactlyOnceWith('chat:error', expect.objectContaining({code: 'INVALID_MESSAGE'}))
    })

    it('answers CONVERSATION_NOT_FOUND when the conversation does not exist for the user', async () => {
        // oxlint-disable-next-line require-yield
        const execute = vi.fn<SendMessageUseCase['execute']>(async function* (input: SendMessageInput) {
            throw new ConversationNotFoundError(input.conversationId!)
        })
        const {socket, emit, receive} = fakeSocket()
        handle(fakeUseCase(execute))(socket)

        await receive('chat:message', {text: 'hola', conversationId: 'ajena'})

        expect(emit).toHaveBeenCalledExactlyOnceWith('chat:error', expect.objectContaining({code: 'CONVERSATION_NOT_FOUND'}))
    })

    it('answers BUSY to a message sent while another answer is in progress', async () => {
        let finish!: () => void
        // An answer that only waits until the test lets it finish.
        // oxlint-disable-next-line require-yield
        const useCase = fakeUseCase(async function* () {
            await new Promise<void>((resolve) => { finish = resolve })
        })
        const {socket, emit, receive} = fakeSocket()
        handle(useCase)(socket)

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
        // An answer that only waits until it's aborted.
        // oxlint-disable-next-line require-yield
        const useCase = fakeUseCase(async function* (input: SendMessageInput) {
            signal = input.signal
            await new Promise((_resolve, reject) => {
                input.signal.addEventListener('abort', () => reject(new Error('aborted')))
            })
        })
        const {socket, emit, receive} = fakeSocket()
        handle(useCase)(socket)

        const answering = receive('chat:message', {text: 'hola'})
        await receive(event)
        await answering

        expect(signal.aborted).toBe(true)
        expect(emit).toHaveBeenCalledExactlyOnceWith('chat:done', {cancelled: true})
    })

    it('answers a generic INTERNAL_ERROR when the use case fails, and accepts new messages after', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const execute = vi.fn<SendMessageUseCase['execute']>()
            // Fails before the first piece of text.
            // oxlint-disable-next-line require-yield
            .mockImplementationOnce(async function* () {
                throw new Error('API key invalid')
            })
            .mockImplementationOnce(async function* () {
                yield {type: 'delta', text: 'ok'}
            })
        const {socket, emit, receive} = fakeSocket()
        handle(fakeUseCase(execute))(socket)

        await receive('chat:message', {text: 'uno'})
        await receive('chat:message', {text: 'dos'})

        expect(emit.mock.calls).toEqual([
            ['chat:error', {code: 'INTERNAL_ERROR', message: 'Elber could not answer, try again'}],
            ['chat:delta', {text: 'ok'}],
            ['chat:done', {cancelled: false}],
        ])
    })

    describe('chat:retry', () => {
        it('retries the conversation for the user and streams the answer like a message', async () => {
            const retry = vi.fn<SendMessageUseCase['retry']>(async function* () {
                yield {type: 'delta', text: 'Otra vez'}
            })
            const {socket, emit, receive} = fakeSocket()
            handle(fakeUseCase(vi.fn(), retry))(socket)

            await receive('chat:retry', {conversationId: 'conv1'})

            expect(retry).toHaveBeenCalledExactlyOnceWith({uid: 'uid-1', conversationId: 'conv1', signal: expect.any(AbortSignal), locate: expect.any(Function)})
            expect(emit.mock.calls).toEqual([['chat:delta', {text: 'Otra vez'}], ['chat:done', {cancelled: false}]])
        })

        it.each([
            ['no payload', undefined],
            ['no conversation id', {}],
            ['a conversation id that could be a path', {conversationId: '../otro/conv1'}],
        ])('answers INVALID_MESSAGE to %s without retrying', async (_case, payload) => {
            const retry = vi.fn<SendMessageUseCase['retry']>()
            const {socket, emit, receive} = fakeSocket()
            handle(fakeUseCase(vi.fn(), retry))(socket)

            await receive('chat:retry', payload)

            expect(retry).not.toHaveBeenCalled()
            expect(emit).toHaveBeenCalledExactlyOnceWith('chat:error', expect.objectContaining({code: 'INVALID_MESSAGE'}))
        })

        it('answers NOTHING_TO_RETRY when the last answer is fine', async () => {
            // oxlint-disable-next-line require-yield
            const retry = vi.fn<SendMessageUseCase['retry']>(async function* (input) {
                throw new NothingToRetryError(input.conversationId)
            })
            const {socket, emit, receive} = fakeSocket()
            handle(fakeUseCase(vi.fn(), retry))(socket)

            await receive('chat:retry', {conversationId: 'conv1'})

            expect(emit).toHaveBeenCalledExactlyOnceWith('chat:error', expect.objectContaining({code: 'NOTHING_TO_RETRY'}))
        })
    })

    describe('rate limit', () => {
        it('answers RATE_LIMITED with the seconds to wait, without answering', async () => {
            const execute = vi.fn<SendMessageUseCase['execute']>()
            const {socket, emit, receive} = fakeSocket()
            handle(fakeUseCase(execute), {take: () => 42})(socket)

            await receive('chat:message', {text: 'hola'})

            expect(execute).not.toHaveBeenCalled()
            expect(emit).toHaveBeenCalledExactlyOnceWith('chat:error', expect.objectContaining({code: 'RATE_LIMITED', retryAfter: 42}))
        })

        it('counts retries too', async () => {
            const retry = vi.fn<SendMessageUseCase['retry']>()
            const {socket, emit, receive} = fakeSocket()
            handle(fakeUseCase(vi.fn(), retry), {take: () => 42})(socket)

            await receive('chat:retry', {conversationId: 'conv1'})

            expect(retry).not.toHaveBeenCalled()
            expect(emit).toHaveBeenCalledExactlyOnceWith('chat:error', expect.objectContaining({code: 'RATE_LIMITED'}))
        })

        it('does not use up the quota on invalid messages', async () => {
            const take = vi.fn(() => 0)
            const {socket, receive} = fakeSocket()
            handle(answering(), {take})(socket)

            await receive('chat:message', {text: ''})

            expect(take).not.toHaveBeenCalled()
        })
    })
})

describe('locate', () => {
    // Sends a message and returns the locate function the use case got.
    const locateFor = async () => {
        const execute = vi.fn<SendMessageUseCase['execute']>(async function* () {})
        const fake = fakeSocket()
        handle(fakeUseCase(execute))(fake.socket)
        await fake.receive('chat:message', {text: '¿Va a llover?'})
        return {...fake, locate: execute.mock.calls[0]![0].locate}
    }

    it('asks the client with chat:location and returns its coordinates', async () => {
        const {locate, timeout, emitWithAck} = await locateFor()
        emitWithAck.mockResolvedValue({lat: 19.43, lon: -99.13})

        expect(await locate()).toEqual({lat: 19.43, lon: -99.13})
        expect(timeout).toHaveBeenCalledExactlyOnceWith(LOCATION_TIMEOUT_MS)
        expect(emitWithAck).toHaveBeenCalledExactlyOnceWith('chat:location')
    })

    it.each([
        ['the user refused', {error: 'DENIED'}],
        ['coordinates out of range', {lat: 91, lon: 0}],
        ['coordinates that are not numbers', {lat: '19', lon: '-99'}],
        ['nothing', undefined],
    ])('returns null when the client answers %s', async (_, reply) => {
        const {locate, emitWithAck} = await locateFor()
        emitWithAck.mockResolvedValue(reply)

        expect(await locate()).toBeNull()
    })

    it('returns null when the client does not answer in time', async () => {
        const {locate, emitWithAck} = await locateFor()
        emitWithAck.mockRejectedValue(new Error('operation has timed out'))

        expect(await locate()).toBeNull()
    })

    it('does not ask a disconnected client', async () => {
        const {locate, socket, emitWithAck} = await locateFor()
        Object.assign(socket, {disconnected: true})

        expect(await locate()).toBeNull()
        expect(emitWithAck).not.toHaveBeenCalled()
    })
})

describe('createMessageRateLimit', () => {
    it('allows `limit` answers per user per window, then says how long to wait', () => {
        let time = 0
        const limit = createMessageRateLimit({limit: 2, windowMs: 60_000, now: () => time})

        expect([limit.take('uid-1'), limit.take('uid-1')]).toEqual([0, 0])
        time = 15_000
        expect(limit.take('uid-1')).toBe(45)
        // Each user has their own quota.
        expect(limit.take('uid-2')).toBe(0)
        // A new window starts once the old one ends.
        time = 60_000
        expect(limit.take('uid-1')).toBe(0)
    })
})
