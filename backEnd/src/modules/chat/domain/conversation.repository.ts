import type { Conversation, Message } from './conversation.js'

// Port: where conversations are stored. Every method is scoped to a user:
// a conversation of someone else is, for this user, one that doesn't exist.
export interface ConversationRepository {
    create(uid: string, data: {title: string}): Promise<Conversation>
    // null if it doesn't exist or belongs to another user.
    find(uid: string, conversationId: string): Promise<Conversation | null>
    // Also marks the conversation as updated (the sidebar sorts by it).
    addMessage(uid: string, conversationId: string, message: Message): Promise<void>
    setAssistantSession(uid: string, conversationId: string, assistantSessionId: string): Promise<void>
}
