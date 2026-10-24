import type { Assistant } from '../domain/assistant.port.js'
import type { ConversationRepository } from '../domain/conversation.repository.js'

// Deletes every conversation of the user with their messages, and the
// assistant's memory of them.
class DeleteAllConversationsUseCase {
    constructor(
        private readonly conversations: ConversationRepository,
        private readonly assistant: Assistant,
    ) {}

    async execute({uid}: {uid: string}): Promise<void> {
        const deleted = await this.conversations.deleteAll(uid)

        // As with one conversation: for the user they are already gone, so a
        // memory that can't be deleted is logged, not thrown.
        const sessions = deleted.flatMap((conversation) => conversation.assistantSessionId ?? [])
        const results = await Promise.allSettled(sessions.map((session) => this.assistant.forget(session)))
        results.forEach((result, i) => {
            if (result.status === 'rejected') console.error(`Could not delete assistant session ${sessions[i]}:`, result.reason)
        })
    }
}

export default DeleteAllConversationsUseCase
