import type { Server } from 'socket.io'
import { createFirebaseTokenVerifier } from '../../shared/auth/token-verifier.js'
import { firebaseAuth } from '../../shared/firebase/firebase-admin.js'
import type { ChatNamespace } from './presentation/chat.events.js'
import buildSocketAuth from './presentation/socket-auth.middleware.js'

// Public entry point of the chat module: only socket.ts imports it. The chat
// talks to the frontend over Socket.IO, in its own namespace (/chat).
interface ChatModuleDeps {
    io: Server
}

const createChatModule = ({io}: ChatModuleDeps) => {
    // The Server is shared by every namespace, so its event types are generic:
    // this cast gives /chat its own typed events.
    const chat = io.of('/chat') as unknown as ChatNamespace

    chat.use(buildSocketAuth(createFirebaseTokenVerifier(firebaseAuth)))

    chat.on('connection', (socket) => {
        const {user} = socket.data
        console.info(`Chat connected: ${user.uid}`)

        // Temporary: answers so the frontend can test the connection.
        socket.on('chat:hello', (payload) => {
            // Types don't reach the wire: a client can send anything, and a
            // throw inside a listener would crash the process.
            if (typeof payload?.text !== 'string') return
            socket.emit('chat:hello', {text: `¡Hola, ${user.email ?? user.uid}! Soy Elber. Recibí: "${payload.text}"`})
        })

        socket.on('disconnect', (reason) => {
            console.info(`Chat disconnected: ${user.uid} (${reason})`)
        })
    })
}

export default createChatModule
