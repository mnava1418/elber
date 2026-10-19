import { io, type Socket } from 'socket.io-client'
import { auth } from './firebase'

// Socket.IO lives on the same server as the API, at its root (no /api/v1).
const SOCKET_URL = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : ''

// Contract of the /chat namespace. Copy of
// backEnd/src/modules/chat/presentation/chat.events.ts: change both together.
export interface ChatServerEvents {
  'chat:hello': (payload: { text: string }) => void
}

export interface ChatClientEvents {
  'chat:hello': (payload: { text: string }) => void
}

export type ChatSocket = Socket<ChatServerEvents, ChatClientEvents>

// Created disconnected: call connect() when the page needs it.
export function createChatSocket(): ChatSocket {
  if (!SOCKET_URL) throw new Error('VITE_API_URL no está configurada (ver web/.env.example)')

  return io(`${SOCKET_URL}/chat`, {
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
  })
}
