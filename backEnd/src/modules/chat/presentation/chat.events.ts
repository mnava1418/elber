import type { Namespace, Socket } from 'socket.io'
import type { AuthUser } from '../../../shared/auth/token-verifier.js'
import type { Source } from '../domain/assistant.port.js'

// Contract of the /chat namespace: event name -> payload. The frontend keeps
// a copy of these types (web/src/lib/socket.ts); change both together.
//
// One answer at a time per connection: after chat:message (or chat:retry)
// the server sends chat:conversation if it started a new conversation, any
// number of chat:delta / chat:tool / chat:sources, then exactly one chat:done
// or chat:error.

// Events the client sends.
export interface ChatClientEvents {
    // Without conversationId, starts a new conversation.
    'chat:message': (payload: {text: string, conversationId?: string}) => void
    // Answers the conversation's last question again, replacing its failed or
    // stopped answer. The question isn't stored twice.
    'chat:retry': (payload: {conversationId: string}) => void
    // Stops the answer in progress. It still ends with chat:done.
    'chat:cancel': () => void
}

// Events the server sends.
export interface ChatServerEvents {
    // The conversation the message started: send its id with the next messages.
    'chat:conversation': (payload: {id: string, title: string}) => void
    // Next piece of the answer text.
    'chat:delta': (payload: {text: string}) => void
    // Elber is using a tool, e.g. {name: 'WebSearch', detail: 'clima en CDMX'}.
    'chat:tool': (payload: {name: string, detail?: string}) => void
    // Sources the answer cites as [n]. Each one replaces the previous list;
    // the last one, just before chat:done, has only those actually cited.
    'chat:sources': (payload: {sources: Source[]}) => void
    'chat:done': (payload: {cancelled: boolean}) => void
    // retryAfter (seconds) comes with RATE_LIMITED. Nothing was stored.
    'chat:error': (payload: {code: ChatErrorCode, message: string, retryAfter?: number}) => void
}

export type ChatErrorCode = 'INVALID_MESSAGE' | 'BUSY' | 'CONVERSATION_NOT_FOUND' | 'NOTHING_TO_RETRY' | 'RATE_LIMITED' | 'INTERNAL_ERROR'

// What the auth middleware stores on each socket.
export interface ChatSocketData {
    user: AuthUser
}

export type ChatNamespace = Namespace<ChatClientEvents, ChatServerEvents, Record<string, never>, ChatSocketData>
export type ChatSocket = Socket<ChatClientEvents, ChatServerEvents, Record<string, never>, ChatSocketData>
