import type { Widget } from '../domain/skill.js'
import type { Assistant, ReplyInput, Source } from '../domain/assistant.port.js'
import { ConversationNotFoundError, titleFrom, type Conversation, type DailyConversation, type ElberMessageStatus, type ToolUse } from '../domain/conversation.js'
import type { ConversationRepository } from '../domain/conversation.repository.js'

export interface SendMessageInput {
    uid: string
    text: string
    // Continues that conversation; without it, starts a new one (in a daily
    // section, today's).
    conversationId?: string
    signal: AbortSignal
    // Asks the user's device where they are (for the weather...).
    locate: ReplyInput['locate']
    // Said in a call: the answer will be read aloud.
    voice?: boolean
}

// What the user sees while Elber answers, in order.
export type SendMessageEvent =
    // A conversation was created for this message (always the first event).
    | {type: 'conversation', id: string, title: string}
    | {type: 'delta', text: string}
    | {type: 'tool', name: string, detail?: string}
    | {type: 'sources', sources: Source[]}
    | {type: 'widget', widget: Widget}

export interface RetryInput {
    uid: string
    conversationId: string
    signal: AbortSignal
    locate: ReplyInput['locate']
}

interface AnswerInput {
    uid: string
    conversation: Conversation
    text: string
    signal: AbortSignal
    locate: ReplyInput['locate']
    voice?: boolean
}

// The conversation doesn't end in a question without a good answer.
export class NothingToRetryError extends Error {
    constructor(conversationId: string) {
        super(`Conversation ${conversationId} has nothing to retry`)
        this.name = 'NothingToRetryError'
    }
}

// Sends a message in a conversation and streams Elber's answer, storing both.
// Ends when the answer is complete; throws if it fails (the answer is still
// stored, as stopped or failed).
class SendMessageUseCase {
    constructor(
        private readonly assistant: Assistant,
        private readonly conversations: ConversationRepository,
        // Only in a section with one conversation per day (the diary).
        private readonly daily?: DailyConversation,
    ) {}

    async *execute({uid, text, conversationId, signal, locate, voice}: SendMessageInput): AsyncGenerator<SendMessageEvent> {
        let conversation = conversationId ? await this.conversations.find(uid, conversationId) : null
        if (!conversation) {
            conversation = await this.create(uid, text, conversationId)
            yield {type: 'conversation', id: conversation.id, title: conversation.title}
        }

        await this.conversations.addMessage(uid, conversation.id, {role: 'user', text})
        yield* this.answer({uid, conversation, text, signal, locate, voice})
    }

    // In a daily section, the first message of the day starts today's
    // conversation; any other missing one doesn't exist (an old day included:
    // it can be continued, not started late).
    private create = async (uid: string, text: string, conversationId?: string): Promise<Conversation> => {
        if (!this.daily) {
            if (conversationId) throw new ConversationNotFoundError(conversationId)
            return await this.conversations.create(uid, {title: titleFrom(text)})
        }
        const today = this.daily(new Date())
        if (conversationId && conversationId !== today.id) throw new ConversationNotFoundError(conversationId)
        return await this.conversations.create(uid, today)
    }

    // Answers the last question again, without storing it twice: a failed or
    // stopped answer is replaced; a question left without one (the answer
    // couldn't even be stored) gets one.
    async *retry({uid, conversationId, signal, locate}: RetryInput): AsyncGenerator<SendMessageEvent> {
        const conversation = await this.conversations.find(uid, conversationId)
        if (!conversation) throw new ConversationNotFoundError(conversationId)

        const messages = await this.conversations.lastMessages(uid, conversationId, 2)
        const last = messages.at(-1)
        const before = messages.at(-2)
        let question: string
        if (last?.role === 'user') {
            question = last.text
        } else if (last?.role === 'elber' && last.status !== 'done' && before?.role === 'user') {
            await this.conversations.deleteMessage(uid, conversationId, last.id)
            question = before.text
        } else {
            throw new NothingToRetryError(conversationId)
        }

        // The assistant does get the question again: its memory of the
        // conversation can't drop the failed attempt.
        yield* this.answer({uid, conversation, text: question, signal, locate})
    }

    // Streams Elber's answer to `text` and stores it when it ends.
    private async *answer({uid, conversation, text, signal, locate, voice}: AnswerInput): AsyncGenerator<SendMessageEvent> {
        // Elber's answer, as it builds up.
        let answer = ''
        let sources: Source[] = []
        const tools: ToolUse[] = []
        const widgets: Widget[] = []
        let status: ElberMessageStatus = 'error'

        try {
            const events = this.assistant.reply({text, signal, uid, conversationId: conversation.id, locate, sessionId: conversation.assistantSessionId, voice})
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
                    case 'widget':
                        widgets.push(event.widget)
                        yield event
                        break
                }
            }
            status = signal.aborted ? 'stopped' : 'done'
        } catch (error) {
            if (signal.aborted) status = 'stopped'
            throw error
        } finally {
            await this.conversations.addMessage(uid, conversation.id, {role: 'elber', text: answer, status, sources, tools, widgets})
        }
    }
}

export default SendMessageUseCase
