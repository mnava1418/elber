import type { Namespace, Socket } from 'socket.io'
import type { AuthUser } from '../../../shared/auth/token-verifier.js'
import type { Widget } from '../domain/skill.js'
import type { Source } from '../domain/assistant.port.js'

// Contract of the /chat namespace: event name -> payload. The frontend keeps
// a copy of these types (web/src/lib/socket.ts); change both together.
//
// One answer at a time per connection: after chat:message (or chat:retry)
// the server sends chat:conversation if it started a new conversation, any
// number of chat:delta / chat:tool / chat:sources / chat:widget, then exactly one chat:done
// or chat:error. While answering, the server may also ask for the user's
// location (chat:location) and wait for the reply.

// Events the client sends.
export interface ChatClientEvents {
    // Without conversationId, starts a new conversation. `voice`: said in a
    // call, so the answer is written to be read aloud.
    'chat:message': (payload: {text: string, conversationId?: string, voice?: boolean}) => void
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
    // Something to show next to the answer, e.g. {type: 'weather', data: {...}}.
    // The frontend draws the types it knows and ignores the rest.
    'chat:widget': (payload: {widget: Widget}) => void
    'chat:done': (payload: {cancelled: boolean}) => void
    // retryAfter (seconds) comes with RATE_LIMITED. Nothing was stored.
    'chat:error': (payload: {code: ChatErrorCode, message: string, retryAfter?: number}) => void
    // Elber needs to know where the user is (e.g. "will it rain?"). The
    // client answers through the ack with the device's location or why not.
    'chat:location': (ack: (reply: LocationReply) => void) => void
}

export type LocationReply = {lat: number, lon: number} | {error: 'DENIED' | 'UNAVAILABLE'}

export type ChatErrorCode = 'INVALID_MESSAGE' | 'BUSY' | 'CONVERSATION_NOT_FOUND' | 'NOTHING_TO_RETRY' | 'RATE_LIMITED' | 'INTERNAL_ERROR'

// What the auth middleware stores on each socket.
export interface ChatSocketData {
    user: AuthUser
}

export type ChatNamespace = Namespace<ChatClientEvents, ChatServerEvents, Record<string, never>, ChatSocketData>
export type ChatSocket = Socket<ChatClientEvents, ChatServerEvents, Record<string, never>, ChatSocketData>
