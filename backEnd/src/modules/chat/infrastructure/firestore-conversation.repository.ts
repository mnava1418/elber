import { FieldPath, FieldValue, Timestamp, type Firestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type { Conversation, ConversationSummary, Message, StoredMessage } from '../domain/conversation.js'
import { InvalidCursorError, type ConversationPage, type ConversationRepository } from '../domain/conversation.repository.js'

// Adapter: conversations in Firestore, under their user, so a lookup can
// never reach someone else's. Each chat section has its own collection
// ("conversations", "diary"...), so one section can never reach another's:
//   users/{uid}/{collection}/{conversationId}            title, assistantSessionId, createdAt, updatedAt
//   users/{uid}/{collection}/{conversationId}/messages/  role, text, (status, sources, tools, widgets), createdAt
class FirestoreConversationRepository implements ConversationRepository {
    constructor(private readonly db: Firestore, private readonly collection: string) {}

    async create(uid: string, {title, id}: {title: string, id?: string}): Promise<Conversation> {
        const ref = id ? this.conversations(uid).doc(id) : this.conversations(uid).doc()
        await ref.set({title, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()})
        return {id: ref.id, title}
    }

    async find(uid: string, conversationId: string): Promise<Conversation | null> {
        const snapshot = await this.conversations(uid).doc(conversationId).get()
        if (!snapshot.exists) return null
        const {title, assistantSessionId} = snapshot.data() as {title: string, assistantSessionId?: string}
        return {id: snapshot.id, title, assistantSessionId}
    }

    async list(uid: string, {limit, cursor}: {limit: number, cursor?: string}): Promise<ConversationPage> {
        // The id breaks ties between equal updatedAt, so a page never skips
        // or repeats one. Single-field indexes are enough for this order.
        let query = this.conversations(uid)
            .orderBy('updatedAt', 'desc')
            .orderBy(FieldPath.documentId(), 'desc')
        if (cursor !== undefined) {
            const {updatedAt, id} = decodeCursor(cursor)
            query = query.startAfter(updatedAt, id)
        }

        // One extra tells whether there is a next page.
        const snapshot = await query.limit(limit + 1).get()
        const docs = snapshot.docs.slice(0, limit)
        const conversations = docs.map((doc): ConversationSummary => {
            const {title, createdAt, updatedAt} = doc.data() as {title: string, createdAt: Timestamp, updatedAt: Timestamp}
            return {id: doc.id, title, createdAt: createdAt.toDate(), updatedAt: updatedAt.toDate()}
        })

        const last = docs.at(-1)
        const nextCursor = snapshot.size > limit && last ? encodeCursor(last.get('updatedAt'), last.id) : null
        return {conversations, nextCursor}
    }

    async listMessages(uid: string, conversationId: string): Promise<StoredMessage[]> {
        const snapshot = await this.messages(uid, conversationId).orderBy('createdAt', 'asc').get()
        return snapshot.docs.map(toStoredMessage)
    }

    async lastMessages(uid: string, conversationId: string, limit: number): Promise<StoredMessage[]> {
        const snapshot = await this.messages(uid, conversationId).orderBy('createdAt', 'desc').limit(limit).get()
        return snapshot.docs.map(toStoredMessage).reverse()
    }

    async addMessage(uid: string, conversationId: string, message: Message): Promise<void> {
        const conversation = this.conversations(uid).doc(conversationId)
        const batch = this.db.batch()
        batch.create(this.messages(uid, conversationId).doc(), {...message, createdAt: FieldValue.serverTimestamp()})
        batch.update(conversation, {updatedAt: FieldValue.serverTimestamp()})
        await batch.commit()
    }

    async setAssistantSession(uid: string, conversationId: string, assistantSessionId: string): Promise<void> {
        await this.conversations(uid).doc(conversationId).update({assistantSessionId})
    }

    async deleteMessage(uid: string, conversationId: string, messageId: string): Promise<void> {
        await this.messages(uid, conversationId).doc(messageId).delete()
    }

    async rename(uid: string, conversationId: string, title: string): Promise<boolean> {
        const ref = this.conversations(uid).doc(conversationId)
        // update() fails on a missing document; a transaction would be more
        // than a rename needs.
        if (!(await ref.get()).exists) return false
        await ref.update({title})
        return true
    }

    async delete(uid: string, conversationId: string): Promise<boolean> {
        const ref = this.conversations(uid).doc(conversationId)
        if (!(await ref.get()).exists) return false
        // Deleting a document leaves its subcollections behind: this also
        // deletes the messages.
        await this.db.recursiveDelete(ref)
        return true
    }

    async deleteAll(uid: string): Promise<Conversation[]> {
        const collection = this.conversations(uid)
        // Read before deleting, for their assistant sessions. One created in
        // between is deleted too; only its session is left behind.
        const snapshot = await collection.get()
        await this.db.recursiveDelete(collection)
        return snapshot.docs.map((doc) => {
            const {title, assistantSessionId} = doc.data() as {title: string, assistantSessionId?: string}
            return {id: doc.id, title, assistantSessionId}
        })
    }

    private conversations(uid: string) {
        return this.db.collection('users').doc(uid).collection(this.collection)
    }

    private messages(uid: string, conversationId: string) {
        return this.conversations(uid).doc(conversationId).collection('messages')
    }
}

// Picked field by field: whatever else the document has stays here.
const toStoredMessage = (doc: QueryDocumentSnapshot): StoredMessage => {
    const data = doc.data()
    const base = {id: doc.id, text: data.text as string, createdAt: (data.createdAt as Timestamp).toDate()}
    return data.role === 'user'
        ? {...base, role: 'user'}
        : {...base, role: 'elber', status: data.status, sources: data.sources ?? [], tools: data.tools ?? [], widgets: data.widgets ?? []}
}

// The cursor is the position of the last conversation of the page:
// updatedAt (exact, to the nanosecond) and id, as base64url JSON.
const encodeCursor = (updatedAt: Timestamp, id: string): string =>
    Buffer.from(JSON.stringify([updatedAt.seconds, updatedAt.nanoseconds, id])).toString('base64url')

const decodeCursor = (cursor: string): {updatedAt: Timestamp, id: string} => {
    try {
        const [seconds, nanoseconds, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString())
        if (typeof id !== 'string' || id === '') throw new Error('Missing id')
        return {updatedAt: new Timestamp(seconds, nanoseconds), id}
    } catch {
        throw new InvalidCursorError()
    }
}

export default FirestoreConversationRepository
