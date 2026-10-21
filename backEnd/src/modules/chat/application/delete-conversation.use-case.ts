import type { Assistant } from '../domain/assistant.port.js'
import { ConversationNotFoundError } from '../domain/conversation.js'
import type { ConversationRepository } from '../domain/conversation.repository.js'

// Deletes a conversation of the user with its messages, and the assistant's
// memory of it. Throws ConversationNotFoundError if it doesn't exist or is
// someone else's.
class DeleteConversationUseCase {
    constructor(
        private readonly conversations: ConversationRepository,
        private readonly assistant: Assistant,
    ) {}

    async execute({uid, conversationId}: {uid: string, conversationId: string}): Promise<void> {
        const conversation = await this.conversations.find(uid, conversationId)
        if (!conversation) throw new ConversationNotFoundError(conversationId)

        // Deleted in between (e.g. from another tab): same answer.
        const deleted = await this.conversations.delete(uid, conversationId)
        if (!deleted) throw new ConversationNotFoundError(conversationId)

        // For the user the conversation is already gone: if its memory can't
        // be deleted, it only takes up space. Logged, not thrown.
        if (conversation.assistantSessionId) {
            try {
                await this.assistant.forget(conversation.assistantSessionId)
            } catch (error) {
                console.error(`Could not delete assistant session ${conversation.assistantSessionId}:`, error)
            }
        }
    }
}

export default DeleteConversationUseCase
