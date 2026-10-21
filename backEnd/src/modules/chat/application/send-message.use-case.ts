import type { Assistant, Source } from '../domain/assistant.port.js'
import { ConversationNotFoundError, titleFrom, type ElberMessageStatus, type ToolUse } from '../domain/conversation.js'
import type { ConversationRepository } from '../domain/conversation.repository.js'

export interface SendMessageInput {
    uid: string
    text: string
    // Continues that conversation; without it, starts a new one.
    conversationId?: string
    signal: AbortSignal
}

// What the user sees while Elber answers, in order.
export type SendMessageEvent =
    // A new conversation was created for this message (always the first event).
    | {type: 'conversation', id: string, title: string}
    | {type: 'delta', text: string}
    | {type: 'tool', name: string, detail?: string}
    | {type: 'sources', sources: Source[]}

// Sends a message in a conversation and streams Elber's answer, storing both.
// Ends when the answer is complete; throws if it fails (the answer is still
// stored, as stopped or failed).
class SendMessageUseCase {
    constructor(
        private readonly assistant: Assistant,
        private readonly conversations: ConversationRepository,
    ) {}

    async *execute({uid, text, conversationId, signal}: SendMessageInput): AsyncGenerator<SendMessageEvent> {
        let conversation
        if (conversationId) {
            conversation = await this.conversations.find(uid, conversationId)
            if (!conversation) throw new ConversationNotFoundError(conversationId)
        } else {
            conversation = await this.conversations.create(uid, {title: titleFrom(text)})
            yield {type: 'conversation', id: conversation.id, title: conversation.title}
        }

        await this.conversations.addMessage(uid, conversation.id, {role: 'user', text})

        // Elber's answer, as it builds up.
        let answer = ''
        let sources: Source[] = []
        const tools: ToolUse[] = []
        let status: ElberMessageStatus = 'error'

        try {
            const events = this.assistant.reply({text, signal, sessionId: conversation.assistantSessionId})
            for await (const event of events) {
                switch (event.type) {
                    case 'session':
                        // The assistant's memory of this conversation: stored to continue it later.
                        if (event.id !== conversation.assistantSessionId) {
                            await this.conversations.setAssistantSession(uid, conversation.id, event.id)
                            conversation.assistantSessionId = event.id
                        }
                        break
                    case 'delta':
                        answer += event.text
                        yield event
                        break
                    case 'tool':
                        tools.push({name: event.name, detail: event.detail})
                        yield event
                        break
                    case 'sources':
                        sources = event.sources
                        yield event
                        break
                }
            }
            status = signal.aborted ? 'stopped' : 'done'
        } catch (error) {
            if (signal.aborted) status = 'stopped'
            throw error
        } finally {
            await this.conversations.addMessage(uid, conversation.id, {role: 'elber', text: answer, status, sources, tools})
        }
    }
}

export default SendMessageUseCase
