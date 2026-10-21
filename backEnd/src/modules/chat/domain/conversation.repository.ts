import type { Conversation, ConversationSummary, Message, StoredMessage } from './conversation.js'

// One page of the user's conversations, most recently updated first.
export interface ConversationPage {
    conversations: ConversationSummary[]
    // Opaque: pass it as `cursor` to get the next page. null on the last one.
    nextCursor: string | null
}

// The cursor wasn't produced by list(): it was altered or made up.
export class InvalidCursorError extends Error {
    constructor() {
        super('Invalid cursor')
        this.name = 'InvalidCursorError'
    }
}

// Port: where conversations are stored. Every method is scoped to a user:
// a conversation of someone else is, for this user, one that doesn't exist.
export interface ConversationRepository {
    create(uid: string, data: {title: string}): Promise<Conversation>
    // null if it doesn't exist or belongs to another user.
    find(uid: string, conversationId: string): Promise<Conversation | null>
    // Throws InvalidCursorError for a cursor list() didn't give.
    list(uid: string, options: {limit: number, cursor?: string}): Promise<ConversationPage>
    // Oldest first. Empty if the conversation doesn't exist.
    listMessages(uid: string, conversationId: string): Promise<StoredMessage[]>
    // The newest `limit` messages, oldest first.
    lastMessages(uid: string, conversationId: string, limit: number): Promise<StoredMessage[]>
    // Also marks the conversation as updated (the sidebar sorts by it).
    addMessage(uid: string, conversationId: string, message: Message): Promise<void>
    setAssistantSession(uid: string, conversationId: string, assistantSessionId: string): Promise<void>
    deleteMessage(uid: string, conversationId: string, messageId: string): Promise<void>
    // Deletes it with its messages. false if it didn't exist.
    delete(uid: string, conversationId: string): Promise<boolean>
}
