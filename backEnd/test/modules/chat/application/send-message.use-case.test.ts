import { describe, expect, it } from 'vitest'
import SendMessageUseCase, { NothingToRetryError, type RetryInput, type SendMessageInput } from '../../../../src/modules/chat/application/send-message.use-case.js'
import type { Assistant, AssistantEvent, ReplyInput } from '../../../../src/modules/chat/domain/assistant.port.js'
import { ConversationNotFoundError, type Message } from '../../../../src/modules/chat/domain/conversation.js'
import InMemoryConversations from '../in-memory-conversations.js'

// An assistant that answers with the given events and records what it got.
const assistantAnswering = (...events: AssistantEvent[]) => {
    const inputs: ReplyInput[] = []
    const assistant: Assistant = {
        forget: async () => {},
        async *reply(input) {
            inputs.push(input)
            yield* events
        },
    }
    return {assistant, inputs}
}

// Where the user is, when a tool asks.
const HERE = {lat: 19.43, lon: -99.13}
const locate = async () => HERE

const run = async (useCase: SendMessageUseCase, input: Omit<SendMessageInput, 'signal' | 'locate'>, signal = new AbortController().signal) => {
    const events = []
    for await (const event of useCase.execute({...input, signal, locate})) events.push(event)
    return events
}

// A daily section where today is always 2026-11-02.
const TODAY = {id: '2026-11-02', title: 'Lunes 2 de noviembre'}
const daily = () => TODAY

describe('SendMessageUseCase in a daily section', () => {
    it('starts today\'s conversation with the first message of the day, named after the day', async () => {
        const {assistant, inputs} = assistantAnswering({type: 'delta', text: '¿Cómo te fue?'})
        const repository = new InMemoryConversations()

        const events = await run(new SendMessageUseCase(assistant, repository, daily), {uid: 'uid-1', text: 'Hola', conversationId: TODAY.id})

        expect(events[0]).toEqual({type: 'conversation', ...TODAY})
        expect(repository.conversations.get(TODAY.id)).toMatchObject({uid: 'uid-1', title: TODAY.title})
        // The tools know which day the answer is about.
        expect(inputs[0]).toMatchObject({conversationId: TODAY.id})
    })

    it('starts today\'s conversation when the message names none', async () => {
        const {assistant} = assistantAnswering()
        const repository = new InMemoryConversations()

        const events = await run(new SendMessageUseCase(assistant, repository, daily), {uid: 'uid-1', text: 'Hola'})

        expect(events[0]).toEqual({type: 'conversation', ...TODAY})
    })

    it('continues today\'s conversation once it exists', async () => {
        const {assistant} = assistantAnswering()
        const repository = new InMemoryConversations()
        await repository.create('uid-1', TODAY)

        const events = await run(new SendMessageUseCase(assistant, repository, daily), {uid: 'uid-1', text: 'Otra cosa', conversationId: TODAY.id})

        expect(events.some((event) => event.type === 'conversation')).toBe(false)
        expect(repository.conversations.get(TODAY.id)?.messages).toHaveLength(2)
    })

    it('does not start a day other than today', async () => {
        const {assistant} = assistantAnswering()

        await expect(run(new SendMessageUseCase(assistant, new InMemoryConversations(), daily), {uid: 'uid-1', text: 'Hola', conversationId: '2026-10-30'}))
            .rejects.toThrow(ConversationNotFoundError)
    })
})

describe('SendMessageUseCase', () => {
    it('starts a new conversation named after the message, and stores both messages', async () => {
        const sources = [{n: 1, url: 'https://a.com', title: 'A'}]
        const widget = {type: 'weather', data: {temp: 22}}
        const {assistant} = assistantAnswering(
            {type: 'session', id: 'session-1'},
            {type: 'tool', name: 'WebSearch', detail: 'clima CDMX'},
            {type: 'sources', sources},
            {type: 'widget', widget},
            {type: 'delta', text: 'Hace sol '},
            {type: 'delta', text: '[1].'},
        )
        const repository = new InMemoryConversations()
        const useCase = new SendMessageUseCase(assistant, repository)

        const events = await run(useCase, {uid: 'uid-1', text: '¿Qué clima hace?'})

        expect(events).toEqual([
            {type: 'conversation', id: 'conv1', title: '¿Qué clima hace?'},
            {type: 'tool', name: 'WebSearch', detail: 'clima CDMX'},
            {type: 'sources', sources},
            {type: 'widget', widget},
            {type: 'delta', text: 'Hace sol '},
            {type: 'delta', text: '[1].'},
        ])
        expect(repository.conversations.get('conv1')).toEqual({
            id: 'conv1',
            uid: 'uid-1',
            title: '¿Qué clima hace?',
            assistantSessionId: 'session-1',
            messages: [
                {role: 'user', text: '¿Qué clima hace?'},
                {role: 'elber', text: 'Hace sol [1].', status: 'done', sources, tools: [{name: 'WebSearch', detail: 'clima CDMX'}], widgets: [widget]},
            ],
        })
    })

    it('gives the assistant who is asking and how to locate them, for the tools', async () => {
        const {assistant, inputs} = assistantAnswering({type: 'delta', text: 'ok'})
        const useCase = new SendMessageUseCase(assistant, new InMemoryConversations())

        await run(useCase, {uid: 'uid-1', text: '¿Va a llover?'})

        expect(inputs[0]).toMatchObject({uid: 'uid-1', locate})
    })

    it('continues an existing conversation with its assistant session', async () => {
        const {assistant, inputs} = assistantAnswering({type: 'session', id: 'session-1'}, {type: 'delta', text: 'ok'})
        const repository = new InMemoryConversations()
        const useCase = new SendMessageUseCase(assistant, repository)

        await run(useCase, {uid: 'uid-1', text: 'uno'})
        const events = await run(useCase, {uid: 'uid-1', text: 'dos', conversationId: 'conv1'})

        expect(inputs.map((input) => input.sessionId)).toEqual([undefined, 'session-1'])
        expect(events).toEqual([{type: 'delta', text: 'ok'}])
        expect(repository.conversations.get('conv1')!.messages).toHaveLength(4)
    })

    it('throws ConversationNotFoundError for a conversation of another user, without answering', async () => {
        const {assistant, inputs} = assistantAnswering()
        const repository = new InMemoryConversations()
        await repository.create('someone-else', {title: 'Suya'})
        const useCase = new SendMessageUseCase(assistant, repository)

        await expect(run(useCase, {uid: 'uid-1', text: 'hola', conversationId: 'conv1'})).rejects.toThrow(ConversationNotFoundError)
        expect(inputs).toEqual([])
        expect(repository.conversations.get('conv1')!.messages).toEqual([])
    })

    it('stores the partial answer as stopped when it is cancelled', async () => {
        const controller = new AbortController()
        const assistant: Assistant = {
            forget: async () => {},
            async *reply({signal}) {
                yield {type: 'delta', text: 'Empiezo'}
                controller.abort()
                if (signal.aborted) throw new Error('aborted')
            },
        }
        const repository = new InMemoryConversations()
        const useCase = new SendMessageUseCase(assistant, repository)

        await expect(run(useCase, {uid: 'uid-1', text: 'hola'}, controller.signal)).rejects.toThrow('aborted')
        expect(repository.conversations.get('conv1')!.messages.at(-1)).toEqual(
            {role: 'elber', text: 'Empiezo', status: 'stopped', sources: [], tools: [], widgets: []},
        )
    })

    it('stores the answer as failed when the assistant fails', async () => {
        // oxlint-disable-next-line require-yield
        const assistant: Assistant = {forget: async () => {}, async *reply() { throw new Error('API down') }}
        const repository = new InMemoryConversations()
        const useCase = new SendMessageUseCase(assistant, repository)

        await expect(run(useCase, {uid: 'uid-1', text: 'hola'})).rejects.toThrow('API down')
        expect(repository.conversations.get('conv1')!.messages.at(-1)).toMatchObject({role: 'elber', status: 'error'})
    })

    describe('retry', () => {
        const retry = async (useCase: SendMessageUseCase, input: Omit<RetryInput, 'signal' | 'locate'>) => {
            const events = []
            for await (const event of useCase.retry({...input, signal: new AbortController().signal, locate})) events.push(event)
            return events
        }

        // conv1 of uid-1: one question and the given answer (if any).
        const conversationWith = async (answer?: Message) => {
            const repository = new InMemoryConversations()
            const {id} = await repository.create('uid-1', {title: 'hola'})
            await repository.setAssistantSession('uid-1', id, 'session-1')
            await repository.addMessage('uid-1', id, {role: 'user', text: 'hola'})
            if (answer) await repository.addMessage('uid-1', id, answer)
            return repository
        }

        it.each([
            ['failed', 'error'],
            ['stopped', 'stopped'],
        ] as const)('replaces a %s answer, asking the same question without storing it again', async (_case, status) => {
            const repository = await conversationWith({role: 'elber', text: 'Empie', status, sources: [], tools: [], widgets: []})
            const {assistant, inputs} = assistantAnswering({type: 'delta', text: 'Hola de nuevo'})

            const events = await retry(new SendMessageUseCase(assistant, repository), {uid: 'uid-1', conversationId: 'conv1'})

            expect(events).toEqual([{type: 'delta', text: 'Hola de nuevo'}])
            expect(inputs).toEqual([expect.objectContaining({text: 'hola', sessionId: 'session-1'})])
            expect(repository.conversations.get('conv1')!.messages).toEqual([
                {role: 'user', text: 'hola'},
                {role: 'elber', text: 'Hola de nuevo', status: 'done', sources: [], tools: [], widgets: []},
            ])
        })

        it('answers a question that was left without an answer', async () => {
            const repository = await conversationWith()
            const {assistant} = assistantAnswering({type: 'delta', text: 'Hola'})

            await retry(new SendMessageUseCase(assistant, repository), {uid: 'uid-1', conversationId: 'conv1'})

            expect(repository.conversations.get('conv1')!.messages).toEqual([
                {role: 'user', text: 'hola'},
                {role: 'elber', text: 'Hola', status: 'done', sources: [], tools: [], widgets: []},
            ])
        })

        it('throws NothingToRetryError when the last answer is fine, touching nothing', async () => {
            const answer: Message = {role: 'elber', text: 'Hola', status: 'done', sources: [], tools: [], widgets: []}
            const repository = await conversationWith(answer)
            const {assistant, inputs} = assistantAnswering()

            await expect(retry(new SendMessageUseCase(assistant, repository), {uid: 'uid-1', conversationId: 'conv1'})).rejects.toThrow(NothingToRetryError)
            expect(inputs).toEqual([])
            expect(repository.conversations.get('conv1')!.messages).toEqual([{role: 'user', text: 'hola'}, answer])
        })

        it('throws ConversationNotFoundError for someone else\'s conversation', async () => {
            const repository = await conversationWith({role: 'elber', text: '', status: 'error', sources: [], tools: [], widgets: []})
            const {assistant, inputs} = assistantAnswering()

            await expect(retry(new SendMessageUseCase(assistant, repository), {uid: 'uid-2', conversationId: 'conv1'})).rejects.toThrow(ConversationNotFoundError)
            expect(inputs).toEqual([])
            expect(repository.conversations.get('conv1')!.messages).toHaveLength(2)
        })
    })
})

describe('SendMessageUseCase in a call', () => {
    it('tells the assistant the answer will be read aloud', async () => {
        const {assistant, inputs} = assistantAnswering()

        await run(new SendMessageUseCase(assistant, new InMemoryConversations()), {uid: 'uid-1', text: 'Hola', voice: true})
        await run(new SendMessageUseCase(assistant, new InMemoryConversations()), {uid: 'uid-1', text: 'Hola'})

        expect(inputs.map((input) => input.voice)).toEqual([true, undefined])
    })
})
