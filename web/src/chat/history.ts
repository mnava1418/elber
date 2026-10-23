import { apiDeleteAuth, apiGetAuth } from '../lib/api'
import type { Widget } from '../lib/socket'
import { toolDetail, toolKind } from './tools'
import type { Source, Turn } from './types'

// Contract of the backend's chat history (GET/DELETE /chat/conversations).
// Copy of the types in backEnd/src/modules/chat/domain: change both together.
// Dates arrive as ISO strings.
export interface ConversationSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ConversationPage {
  conversations: ConversationSummary[]
  // Pass it as `cursor` for the next page; null on the last one.
  nextCursor: string | null
}

type StoredMessage = { id: string; createdAt: string } & (
  | { role: 'user'; text: string }
  | {
      role: 'elber'
      text: string
      status: 'done' | 'stopped' | 'error'
      sources: Source[]
      tools: { name: string; detail?: string }[]
      widgets: Widget[]
    }
)

export interface ConversationDetail {
  id: string
  title: string
  messages: StoredMessage[]
}

export function listConversations(cursor?: string): Promise<ConversationPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return apiGetAuth(`/chat/conversations${query}`)
}

export function getConversation(id: string): Promise<ConversationDetail> {
  return apiGetAuth(`/chat/conversations/${encodeURIComponent(id)}`)
}

export function deleteConversation(id: string): Promise<void> {
  return apiDeleteAuth(`/chat/conversations/${encodeURIComponent(id)}`)
}

// Stored messages as the thread shows them. Each answer replies to the
// question before it (what retry re-sends).
export function toTurns(messages: StoredMessage[]): Turn[] {
  let lastQuestion = ''
  return messages.map((m): Turn => {
    if (m.role === 'user') {
      lastQuestion = m.id
      return { id: m.id, role: 'user', text: m.text }
    }
    return {
      id: m.id,
      role: 'elber',
      replyTo: lastQuestion,
      status: m.status,
      text: m.text,
      sources: m.sources,
      widgets: m.widgets,
      steps: m.tools.map((tool, i) => {
        const kind = toolKind(tool.name)
        return { id: `${m.id}-${i}`, kind, detail: toolDetail(kind, tool.detail), status: 'done' }
      }),
    }
  })
}
