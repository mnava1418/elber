import { ConversationNotFoundError, type Conversation } from '../domain/conversation.js'
import type { ConversationRepository } from '../domain/conversation.repository.js'

// Gives a conversation of the user the title they chose instead of the one
// from its first message. Throws ConversationNotFoundError if it doesn't
// exist or is someone else's.
class RenameConversationUseCase {
    constructor(private readonly conversations: ConversationRepository) {}

    async execute({uid, conversationId, title}: {uid: string, conversationId: string, title: string}): Promise<Pick<Conversation, 'id' | 'title'>> {
        const renamed = await this.conversations.rename(uid, conversationId, title)
        if (!renamed) throw new ConversationNotFoundError(conversationId)
        return {id: conversationId, title}
    }
}

export default RenameConversationUseCase
