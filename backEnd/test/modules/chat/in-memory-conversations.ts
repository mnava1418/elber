import type { Conversation, Message, StoredMessage } from '../../../src/modules/chat/domain/conversation.js'
import { InvalidCursorError, type ConversationRepository } from '../../../src/modules/chat/domain/conversation.repository.js'

// Conversations in memory, keyed by user like the real one. Time is a
// counter: every write makes the conversation the most recently updated.
class InMemoryConversations implements ConversationRepository {
    readonly conversations = new Map<string, Conversation & {uid: string, messages: Message[]}>()
    private readonly updatedAt = new Map<string, number>()
    private clock = 0

    async create(uid: string, {title, id = `conv${this.conversations.size + 1}`}: {title: string, id?: string}) {
        this.conversations.set(id, {id, uid, title, messages: []})
        this.touch(id)
        return {id, title}
    }

    async find(uid: string, conversationId: string) {
        const stored = this.owned(uid, conversationId)
        if (!stored) return null
        return {id: stored.id, title: stored.title, assistantSessionId: stored.assistantSessionId}
    }

    // The cursor is the id of the last conversation of the page.
    async list(uid: string, {limit, cursor}: {limit: number, cursor?: string}) {
        const all = [...this.conversations.values()]
            .filter((conversation) => conversation.uid === uid)
            .sort((a, b) => this.updatedAt.get(b.id)! - this.updatedAt.get(a.id)!)
        let start = 0
        if (cursor !== undefined) {
            start = all.findIndex((conversation) => conversation.id === cursor) + 1
            if (start === 0) throw new InvalidCursorError()
        }
        const page = all.slice(start, start + limit)
        return {
            conversations: page.map(({id, title}) => ({id, title, createdAt: new Date(0), updatedAt: new Date(this.updatedAt.get(id)!)})),
            nextCursor: start + limit < all.length ? page.at(-1)!.id : null,
        }
    }

    // A message's id is its position: m1, m2... (deleting the last one keeps
    // the others' ids).
    async listMessages(uid: string, conversationId: string): Promise<StoredMessage[]> {
        const messages = this.owned(uid, conversationId)?.messages ?? []
        return messages.map((message, i) => ({...message, id: `m${i + 1}`, createdAt: new Date(i)}))
    }

    async lastMessages(uid: string, conversationId: string, limit: number) {
        return (await this.listMessages(uid, conversationId)).slice(-limit)
    }

    async addMessage(_uid: string, conversationId: string, message: Message) {
        this.conversations.get(conversationId)!.messages.push(message)
        this.touch(conversationId)
    }

    async setAssistantSession(_uid: string, conversationId: string, assistantSessionId: string) {
        this.conversations.get(conversationId)!.assistantSessionId = assistantSessionId
    }

    async deleteMessage(_uid: string, conversationId: string, messageId: string) {
        this.conversations.get(conversationId)!.messages.splice(Number(messageId.slice(1)) - 1, 1)
    }

    async rename(uid: string, conversationId: string, title: string) {
        const stored = this.owned(uid, conversationId)
        if (!stored) return false
        stored.title = title
        return true
    }

    async delete(uid: string, conversationId: string) {
        if (!this.owned(uid, conversationId)) return false
        this.conversations.delete(conversationId)
        return true
    }

    async deleteAll(uid: string) {
        const owned = [...this.conversations.values()].filter((conversation) => conversation.uid === uid)
        for (const {id} of owned) this.conversations.delete(id)
        return owned.map(({id, title, assistantSessionId}) => ({id, title, assistantSessionId}))
    }

    private owned(uid: string, conversationId: string) {
        const stored = this.conversations.get(conversationId)
        return stored?.uid === uid ? stored : undefined
    }

    private touch(conversationId: string) {
        this.updatedAt.set(conversationId, ++this.clock)
    }
}

export default InMemoryConversations
