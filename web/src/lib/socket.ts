import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client'
import { auth } from './firebase'

// Socket.IO lives on the same server as the API, at its root (no /api/v1).
const SOCKET_URL = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : ''

// Contract of the chat namespaces (/chat, /diary...). Copy of
// backEnd/src/modules/chat/presentation/chat.events.ts: change both together.
//
// One answer at a time: after chat:message (or chat:retry) the server sends
// chat:conversation if it started a new conversation, any number of
// chat:delta / chat:tool / chat:sources / chat:widget, then exactly one chat:done or chat:error.
// While answering, the server may also ask for the user's location (chat:location).
export interface ChatServerEvents {
  // The conversation the message started: send its id with the next messages.
  'chat:conversation': (payload: { id: string; title: string }) => void
  'chat:delta': (payload: { text: string }) => void
  'chat:tool': (payload: { name: string; detail?: string }) => void
  // Each one replaces the previous list; the last one has only the cited sources.
  'chat:sources': (payload: { sources: { n: number; url: string; title: string }[] }) => void
  // Something to show next to the answer, e.g. a weather card. Unknown types are ignored.
  'chat:widget': (payload: { widget: Widget }) => void
  'chat:done': (payload: { cancelled: boolean }) => void
  // retryAfter (seconds) comes with RATE_LIMITED. Nothing was stored.
  'chat:error': (payload: { code: ChatErrorCode; message: string; retryAfter?: number }) => void
  // Elber needs to know where the user is (e.g. "will it rain?"): answer through the ack.
  'chat:location': (ack: (reply: LocationReply) => void) => void
}

// Each `type` has its own `data` (see src/chat/widgets).
export interface Widget {
  type: string
  data: unknown
}

export type LocationReply = { lat: number; lon: number } | { error: 'DENIED' | 'UNAVAILABLE' }

export interface ChatClientEvents {
  // Without conversationId, starts a new conversation.
  // `voice`: said in a call, so the answer is written to be read aloud.
  'chat:message': (payload: { text: string; conversationId?: string; voice?: boolean }) => void
  // Answers the last question again, replacing its failed or stopped answer.
  'chat:retry': (payload: { conversationId: string }) => void
  'chat:cancel': () => void
}

export type ChatErrorCode = 'INVALID_MESSAGE' | 'BUSY' | 'CONVERSATION_NOT_FOUND' | 'NOTHING_TO_RETRY' | 'RATE_LIMITED' | 'INTERNAL_ERROR'

export type ChatSocket = Socket<ChatServerEvents, ChatClientEvents>

// Created disconnected: call connect() when the page needs it.
// `namespace` is the section's (/chat, /diary); `options` overrides the defaults below.
export function createChatSocket(namespace: string, options: Partial<ManagerOptions & SocketOptions> = {}): ChatSocket {
  if (!SOCKET_URL) throw new Error('VITE_API_URL no está configurada (ver web/.env.example)')

  return io(`${SOCKET_URL}${namespace}`, {
    transports: ['websocket'],
    reconnectionDelayMax: 3000,
    timeout: 10000,
    autoConnect: false,
    // A function, not an object: it runs on every (re)connection, so the
    // backend always gets a fresh ID token (they expire after one hour).
    auth: (cb) => {
      const user = auth?.currentUser
      if (!user) return cb({})
      user
        .getIdToken()
        .then((token) => cb({ token }))
        .catch(() => cb({}))
    },
    ...options,
  })
}
