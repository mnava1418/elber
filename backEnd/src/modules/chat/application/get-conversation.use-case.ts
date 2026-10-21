import { ConversationNotFoundError, type StoredMessage } from '../domain/conversation.js'
import type { ConversationRepository } from '../domain/conversation.repository.js'

// What the app needs to show a conversation again. The assistant's session
// stays in the backend.
export interface ConversationDetail {
    id: string
    title: string
    messages: StoredMessage[]
}

// A conversation of the user with all its messages. Throws
// ConversationNotFoundError if it doesn't exist or is someone else's.
class GetConversationUseCase {
    constructor(private readonly conversations: ConversationRepository) {}

    async execute({uid, conversationId}: {uid: string, conversationId: string}): Promise<ConversationDetail> {
        // In parallel: the messages of a missing conversation are just empty.
        const [conversation, messages] = await Promise.all([
            this.conversations.find(uid, conversationId),
            this.conversations.listMessages(uid, conversationId),
        ])
        if (!conversation) throw new ConversationNotFoundError(conversationId)
        return {id: conversation.id, title: conversation.title, messages}
    }
}

export default GetConversationUseCase
