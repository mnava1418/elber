// Firestore auto ids are 20 alphanumeric characters, and a diary day's is its
// date (2026-11-02); anything else can't exist.
const CONVERSATION_ID = /^[A-Za-z0-9-]{1,64}$/

export const isConversationId = (value: unknown): value is string =>
    typeof value === 'string' && CONVERSATION_ID.test(value)
