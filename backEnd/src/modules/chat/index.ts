import { mkdirSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'
import type { Router } from 'express'
import type { Server } from 'socket.io'
import type { Skill } from '../../shared/skills/skill.js'
import env from '../../config/env.js'
import { createFirebaseTokenVerifier } from '../../shared/auth/token-verifier.js'
import { firebaseAuth, firestore } from '../../shared/firebase/firebase-admin.js'
import { buildRequireAuth } from '../../shared/http/middlewares/auth.middleware.js'
import DeleteAllConversationsUseCase from './application/delete-all-conversations.use-case.js'
import DeleteConversationUseCase from './application/delete-conversation.use-case.js'
import GetConversationUseCase from './application/get-conversation.use-case.js'
import ListConversationsUseCase from './application/list-conversations.use-case.js'
import RenameConversationUseCase from './application/rename-conversation.use-case.js'
import SendMessageUseCase from './application/send-message.use-case.js'
import ClaudeAgentAssistant from './infrastructure/claude-agent-assistant.js'
import FirestoreConversationRepository from './infrastructure/firestore-conversation.repository.js'
import type { ChatNamespace } from './presentation/chat.events.js'
import buildChatRoutes from './presentation/chat.routes.js'
import buildChatSocketHandler from './presentation/chat-socket.handler.js'
import { createMessageRateLimit } from './presentation/message-rate-limit.js'
import ConversationsController from './presentation/conversations.controller.js'
import buildSocketAuth from './presentation/socket-auth.middleware.js'

const MODEL = 'claude-sonnet-5-5'
// Answers (messages and retries) per user every 15 minutes.
const MESSAGE_LIMIT = 20
const MESSAGE_WINDOW_MS = 15 * 60 * 1000

// Public entry point of the chat module: only app.ts imports it. The chat
// talks to the frontend over Socket.IO, in its own namespace (/chat); its
// history (list, load, delete) is served over HTTP by the router.
export interface ChatModule {
    router: Router
}

interface ChatModuleDeps {
    io: Server
    // What Elber can do and know beyond chatting (weather, memory...).
    skills: Skill[]
}

const createChatModule = ({io, skills}: ChatModuleDeps): ChatModule => {
    const workDir = path.join(tmpdir(), 'elber-agent')
    mkdirSync(workDir, {recursive: true})
    // Not in tmp: the OS cleans it up, and Elber would forget conversations.
    const configDir = path.join(homedir(), '.elber', 'agent')
    mkdirSync(configDir, {recursive: true})

    // To switch agent framework, swap this adapter for another Assistant.
    const assistant = new ClaudeAgentAssistant({apiKey: env.ANTHROPIC_API_KEY, model: MODEL, workDir, configDir, skills})
    const conversations = new FirestoreConversationRepository(firestore)
    const sendMessage = new SendMessageUseCase(assistant, conversations)
    const verifyToken = createFirebaseTokenVerifier(firebaseAuth)

    // The Server is shared by every namespace, so its event types are generic:
    // this cast gives /chat its own typed events.
    const chat = io.of('/chat') as unknown as ChatNamespace

    chat.use(buildSocketAuth(verifyToken))
    // One for the whole namespace: a user's connections share the quota.
    const rateLimit = createMessageRateLimit({limit: MESSAGE_LIMIT, windowMs: MESSAGE_WINDOW_MS})
    chat.on('connection', buildChatSocketHandler(sendMessage, rateLimit))

    const controller = new ConversationsController(
        new ListConversationsUseCase(conversations),
        new GetConversationUseCase(conversations),
        new DeleteConversationUseCase(conversations, assistant),
        new DeleteAllConversationsUseCase(conversations, assistant),
        new RenameConversationUseCase(conversations),
    )

    return {
        router: buildChatRoutes(buildRequireAuth(verifyToken), controller),
    }
}

export default createChatModule
