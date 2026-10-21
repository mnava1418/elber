import type { ConversationPage, ConversationRepository } from '../domain/conversation.repository.js'

export interface ListConversationsInput {
    uid: string
    limit: number
    // From the previous page; without it, the first page.
    cursor?: string
}

// The user's conversations for the sidebar, most recently updated first.
class ListConversationsUseCase {
    constructor(private readonly conversations: ConversationRepository) {}

    execute({uid, limit, cursor}: ListConversationsInput): Promise<ConversationPage> {
        return this.conversations.list(uid, {limit, cursor})
    }
}

export default ListConversationsUseCase
