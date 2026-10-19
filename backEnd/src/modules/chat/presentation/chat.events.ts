import type { Namespace } from 'socket.io'
import type { AuthUser } from '../../../shared/auth/token-verifier.js'

// Contract of the /chat namespace: event name -> payload. The frontend keeps
// a copy of these types (web/src/lib/socket.ts); change both together.

// Events the client sends.
export interface ChatClientEvents {
    // Temporary: connection test until the agent is wired in.
    'chat:hello': (payload: {text: string}) => void
}

// Events the server sends.
export interface ChatServerEvents {
    'chat:hello': (payload: {text: string}) => void
}

// What the auth middleware stores on each socket.
export interface ChatSocketData {
    user: AuthUser
}

export type ChatNamespace = Namespace<ChatClientEvents, ChatServerEvents, Record<string, never>, ChatSocketData>
