import { mkdirSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'
import type { Router } from 'express'
import type { Server } from 'socket.io'
import type { Skill } from './domain/skill.js'
import type { DailyConversation } from './domain/conversation.js'
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

export { ELBER_SYSTEM_PROMPT } from './infrastructure/elber-system-prompt.js'
// The skills live inside the chat (they are its plugins, not modules), but
// app.ts decides which section gets which, so they are exported from here.
export { default as createWeatherSkill } from './skills/weather/index.js'

// Public entry point of the chat module: only app.ts imports it, once per
// section of the app (the chat, the diary...). Each section talks to the
// frontend over Socket.IO, in its own namespace; its history (list, load,
// delete) is served over HTTP by the router.
export interface ChatModule {
    router: Router
}

// A chat with its own agent and its own conversations. Sections share no
// data: each one only sees its own collection and has only its own tools.
export interface ChatSection {
    // Socket.IO namespace, e.g. "/chat".
    namespace: string
    // Firestore collection of its conversations, under each user.
    collection: string
    // Who the agent is in this section.
    systemPrompt: string
    // What it can do and know beyond chatting (weather, memory...).
    skills: Skill[]
    // Whether it can search the web and read pages.
    webTools: boolean
    // Who may use it; everyone signed in when left out.
    canUse?: (uid: string) => boolean
    // One conversation per day (the diary), named after it.
    daily?: DailyConversation
}

interface ChatModuleDeps {
    io: Server
    section: ChatSection
}

const createChatModule = ({io, section}: ChatModuleDeps): ChatModule => {
    const {namespace, collection, systemPrompt, skills, webTools, canUse, daily} = section
    const workDir = path.join(tmpdir(), 'elber-agent')
    mkdirSync(workDir, {recursive: true})
    // Not in tmp: the OS cleans it up, and Elber would forget conversations.
    const configDir = path.join(homedir(), '.elber', 'agent')
    mkdirSync(configDir, {recursive: true})

    // To switch agent framework, swap this adapter for another Assistant.
    const assistant = new ClaudeAgentAssistant({apiKey: env.ANTHROPIC_API_KEY, model: MODEL, systemPrompt, webTools, workDir, configDir, skills})
    const conversations = new FirestoreConversationRepository(firestore, collection)
    const sendMessage = new SendMessageUseCase(assistant, conversations, daily)
    const verifyToken = createFirebaseTokenVerifier(firebaseAuth)

    // The Server is shared by every namespace, so its event types are generic:
    // this cast gives the section's namespace its own typed events.
    const chat = io.of(namespace) as unknown as ChatNamespace

    chat.use(buildSocketAuth(verifyToken, canUse))
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
        router: buildChatRoutes(buildRequireAuth(verifyToken), controller, canUse, daily),
    }
}

export default createChatModule
