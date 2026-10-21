import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { Conversation, Message } from '../domain/conversation.js'
import type { ConversationRepository } from '../domain/conversation.repository.js'

// Adapter: conversations in Firestore, under their user, so a lookup can
// never reach someone else's:
//   users/{uid}/conversations/{conversationId}            title, assistantSessionId, createdAt, updatedAt
//   users/{uid}/conversations/{conversationId}/messages/  role, text, (status, sources, tools), createdAt
class FirestoreConversationRepository implements ConversationRepository {
    constructor(private readonly db: Firestore) {}

    async create(uid: string, {title}: {title: string}): Promise<Conversation> {
        const ref = this.conversations(uid).doc()
        await ref.set({title, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()})
        return {id: ref.id, title}
    }

    async find(uid: string, conversationId: string): Promise<Conversation | null> {
        const snapshot = await this.conversations(uid).doc(conversationId).get()
        if (!snapshot.exists) return null
        const {title, assistantSessionId} = snapshot.data() as {title: string, assistantSessionId?: string}
        return {id: snapshot.id, title, assistantSessionId}
    }

    async addMessage(uid: string, conversationId: string, message: Message): Promise<void> {
        const conversation = this.conversations(uid).doc(conversationId)
        const batch = this.db.batch()
        batch.create(conversation.collection('messages').doc(), {...message, createdAt: FieldValue.serverTimestamp()})
        batch.update(conversation, {updatedAt: FieldValue.serverTimestamp()})
        await batch.commit()
    }

    async setAssistantSession(uid: string, conversationId: string, assistantSessionId: string): Promise<void> {
        await this.conversations(uid).doc(conversationId).update({assistantSessionId})
    }

    private conversations(uid: string) {
        return this.db.collection('users').doc(uid).collection('conversations')
    }
}

export default FirestoreConversationRepository
