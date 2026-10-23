import type { Widget } from '../../../shared/skills/skill.js'
import type { Source } from './assistant.port.js'

// A chat between a user and Elber. Its messages are what the app shows; the
// assistant keeps its own memory of it (assistantSessionId).
export interface Conversation {
    id: string
    title: string
    // Opaque id the assistant gives the conversation, to continue it.
    // Unset until the first answer starts.
    assistantSessionId?: string
}

// A conversation as the sidebar lists it.
export interface ConversationSummary {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
}

// A tool Elber used while answering, e.g. {name: 'WebSearch', detail: 'clima CDMX'}.
export interface ToolUse {
    name: string
    detail?: string
}

export type ElberMessageStatus = 'done' | 'stopped' | 'error'

export type Message =
    | {role: 'user', text: string}
    | {role: 'elber', text: string, status: ElberMessageStatus, sources: Source[], tools: ToolUse[], widgets: Widget[]}

// A message as it was stored, to show it again.
export type StoredMessage = Message & {id: string, createdAt: Date}

export class ConversationNotFoundError extends Error {
    constructor(conversationId: string) {
        super(`Conversation ${conversationId} not found`)
        this.name = 'ConversationNotFoundError'
    }
}

const MAX_TITLE_LENGTH = 60

// A conversation is named after its first message, on a single line.
export const titleFrom = (text: string): string => {
    const line = text.replace(/\s+/g, ' ').trim()
    return line.length <= MAX_TITLE_LENGTH ? line : `${line.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`
}
