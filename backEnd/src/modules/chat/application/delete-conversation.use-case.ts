import { ConversationNotFoundError } from '../domain/conversation.js'
import type { ConversationRepository } from '../domain/conversation.repository.js'

// Deletes a conversation of the user with its messages. Throws
// ConversationNotFoundError if it doesn't exist or is someone else's.
class DeleteConversationUseCase {
    constructor(private readonly conversations: ConversationRepository) {}

    async execute({uid, conversationId}: {uid: string, conversationId: string}): Promise<void> {
        const deleted = await this.conversations.delete(uid, conversationId)
        if (!deleted) throw new ConversationNotFoundError(conversationId)
    }
}

export default DeleteConversationUseCase
