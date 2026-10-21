import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SendMessageUseCase, { ConversationNotFoundError, type SendMessageEvent, type SendMessageInput } from '../../../../src/modules/chat/application/send-message.use-case.js'
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

// Only execute() is used by the handler; no assistant or storage behind it.
const fakeUseCase = (execute: SendMessageUseCase['execute']) =>
    ({execute}) as unknown as SendMessageUseCase

// A use case that answers with the given events.
const answering = (...events: SendMessageEvent[]) => fakeUseCase(async function* () {
    yield* events
})

describe('chat socket handler', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('streams the answer as chat:conversation / delta / tool / sources and ends with chat:done', async () => {
        const sources = [{n: 1, url: 'https://a.com', title: 'A'}]
        const {socket, emit, receive} = fakeSocket()
        buildChatSocketHandler(answering(
            {type: 'conversation', id: 'conv1', title: '¿Qué clima hace?'},
            {type: 'delta', text: 'Déjame buscar.'},
            {type: 'tool', name: 'WebSearch', detail: 'clima CDMX'},
            {type: 'sources', sources},
            {type: 'delta', text: 'Hace sol [1].'},
        ))(socket)

        await receive('chat:message', {text: '¿Qué clima hace?'})

        expect(emit.mock.calls).toEqual([
            ['chat:conversation', {id: 'conv1', title: '¿Qué clima hace?'}],
            ['chat:delta', {text: 'Déjame buscar.'}],
            ['chat:tool', {name: 'WebSearch', detail: 'clima CDMX'}],
            ['chat:sources', {sources}],
            ['chat:delta', {text: 'Hace sol [1].'}],
            ['chat:done', {cancelled: false}],
        ])
    })

    it('runs the use case with the user, the trimmed text and the conversation', async () => {
        const execute = vi.fn<SendMessageUseCase['execute']>(async function* () {})
        const {socket, receive} = fakeSocket()
        buildChatSocketHandler(fakeUseCase(execute))(socket)

        await receive('chat:message', {text: '  hola  ', conversationId: 'conv1'})

        expect(execute).toHaveBeenCalledExactlyOnceWith({uid: 'uid-1', text: 'hola', conversationId: 'conv1', signal: expect.any(AbortSignal)})
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
        buildChatSocketHandler(fakeUseCase(execute))(socket)

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
        buildChatSocketHandler(fakeUseCase(execute))(socket)

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
        buildChatSocketHandler(useCase)(socket)

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
        buildChatSocketHandler(useCase)(socket)

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
        buildChatSocketHandler(fakeUseCase(execute))(socket)

        await receive('chat:message', {text: 'uno'})
        await receive('chat:message', {text: 'dos'})

        expect(emit.mock.calls).toEqual([
            ['chat:error', {code: 'INTERNAL_ERROR', message: 'Elber could not answer, try again'}],
            ['chat:delta', {text: 'ok'}],
            ['chat:done', {cancelled: false}],
        ])
    })
})
