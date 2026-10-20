import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Server } from 'socket.io'
import env from '../../config/env.js'
import { createFirebaseTokenVerifier } from '../../shared/auth/token-verifier.js'
import { firebaseAuth } from '../../shared/firebase/firebase-admin.js'
import ClaudeAgentAssistant from './infrastructure/claude-agent-assistant.js'
import type { ChatNamespace } from './presentation/chat.events.js'
import buildChatSocketHandler from './presentation/chat-socket.handler.js'
import buildSocketAuth from './presentation/socket-auth.middleware.js'

const MODEL = 'claude-sonnet-5-5'

// Public entry point of the chat module: only socket.ts imports it. The chat
// talks to the frontend over Socket.IO, in its own namespace (/chat).
interface ChatModuleDeps {
    io: Server
}

const createChatModule = ({io}: ChatModuleDeps) => {
    const workDir = path.join(tmpdir(), 'elber-agent')
    mkdirSync(workDir, {recursive: true})

    // To switch agent framework, swap this adapter for another Assistant.
    const assistant = new ClaudeAgentAssistant({apiKey: env.ANTHROPIC_API_KEY, model: MODEL, workDir})

    // The Server is shared by every namespace, so its event types are generic:
    // this cast gives /chat its own typed events.
    const chat = io.of('/chat') as unknown as ChatNamespace

    chat.use(buildSocketAuth(createFirebaseTokenVerifier(firebaseAuth)))
    chat.on('connection', buildChatSocketHandler(assistant))
}

export default createChatModule
