import { describe, expect, it } from 'vitest'
import SendMessageUseCase, { ConversationNotFoundError, type SendMessageInput } from '../../../../src/modules/chat/application/send-message.use-case.js'
import type { Assistant, AssistantEvent, ReplyInput } from '../../../../src/modules/chat/domain/assistant.port.js'
import type { Conversation, Message } from '../../../../src/modules/chat/domain/conversation.js'
import type { ConversationRepository } from '../../../../src/modules/chat/domain/conversation.repository.js'

// Conversations in memory, keyed by user like the real one.
class InMemoryConversations implements ConversationRepository {
    readonly conversations = new Map<string, Conversation & {uid: string, messages: Message[]}>()

    async create(uid: string, {title}: {title: string}) {
        const id = `conv${this.conversations.size + 1}`
        this.conversations.set(id, {id, uid, title, messages: []})
        return {id, title}
    }

    async find(uid: string, conversationId: string) {
        const stored = this.conversations.get(conversationId)
        if (!stored || stored.uid !== uid) return null
        return {id: stored.id, title: stored.title, assistantSessionId: stored.assistantSessionId}
    }

    async addMessage(_uid: string, conversationId: string, message: Message) {
        this.conversations.get(conversationId)!.messages.push(message)
    }

    async setAssistantSession(_uid: string, conversationId: string, assistantSessionId: string) {
        this.conversations.get(conversationId)!.assistantSessionId = assistantSessionId
    }
}

// An assistant that answers with the given events and records what it got.
const assistantAnswering = (...events: AssistantEvent[]) => {
    const inputs: ReplyInput[] = []
    const assistant: Assistant = {
        async *reply(input) {
            inputs.push(input)
            yield* events
        },
    }
    return {assistant, inputs}
}

const run = async (useCase: SendMessageUseCase, input: Omit<SendMessageInput, 'signal'>, signal = new AbortController().signal) => {
    const events = []
    for await (const event of useCase.execute({...input, signal})) events.push(event)
    return events
}

describe('SendMessageUseCase', () => {
    it('starts a new conversation named after the message, and stores both messages', async () => {
        const sources = [{n: 1, url: 'https://a.com', title: 'A'}]
        const {assistant} = assistantAnswering(
            {type: 'session', id: 'session-1'},
            {type: 'tool', name: 'WebSearch', detail: 'clima CDMX'},
            {type: 'sources', sources},
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
                {role: 'elber', text: 'Hace sol [1].', status: 'done', sources, tools: [{name: 'WebSearch', detail: 'clima CDMX'}]},
            ],
        })
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
            {role: 'elber', text: 'Empiezo', status: 'stopped', sources: [], tools: []},
        )
    })

    it('stores the answer as failed when the assistant fails', async () => {
        // oxlint-disable-next-line require-yield
        const assistant: Assistant = {async *reply() { throw new Error('API down') }}
        const repository = new InMemoryConversations()
        const useCase = new SendMessageUseCase(assistant, repository)

        await expect(run(useCase, {uid: 'uid-1', text: 'hola'})).rejects.toThrow('API down')
        expect(repository.conversations.get('conv1')!.messages.at(-1)).toMatchObject({role: 'elber', status: 'error'})
    })
})
