import { apiDeleteAuth, apiGetAuth, apiPatchAuth } from '../lib/api'
import type { Widget } from '../lib/socket'
import { toolDetail, toolKind } from './tools'
import type { Source, Turn } from './types'

// Contract of the backend's chat history (GET/DELETE <section>/conversations).
// `api` is the section's path (/chat, /diary).
// Copy of web/src/chat/history.ts (itself a copy of the types in
// backEnd/src/modules/chat/domain): change them together.
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

// Most recently updated first. Without `limit` the backend's default page size.
export function listConversations(api: string, cursor?: string, limit?: number): Promise<ConversationPage> {
  return apiGetAuth(`${api}/conversations${conversationsQuery(cursor, limit)}`)
}

// The query string by hand: React Native's URLSearchParams doesn't implement set().
export function conversationsQuery(cursor?: string, limit?: number) {
  const params: string[] = []
  if (cursor) params.push(`cursor=${encodeURIComponent(cursor)}`)
  if (limit) params.push(`limit=${limit}`)
  return params.length ? `?${params.join('&')}` : ''
}

export function getConversation(api: string, id: string): Promise<ConversationDetail> {
  return apiGetAuth(`${api}/conversations/${encodeURIComponent(id)}`)
}

// The backend's limit for a title.
export const MAX_TITLE_LENGTH = 60

/** Resolves to the title as the backend saved it (on one line). */
export async function renameConversation(api: string, id: string, title: string): Promise<string> {
  const renamed = await apiPatchAuth<{ id: string; title: string }>(`${api}/conversations/${encodeURIComponent(id)}`, { title })
  return renamed.title
}

export function deleteConversation(api: string, id: string): Promise<void> {
  return apiDeleteAuth(`${api}/conversations/${encodeURIComponent(id)}`)
}

export function deleteAllConversations(api: string): Promise<void> {
  return apiDeleteAuth(`${api}/conversations`)
}

/** In a daily section (the diary): which conversation is today's. The backend decides when the day changes. */
export function getToday(api: string): Promise<{ id: string; title: string }> {
  return apiGetAuth(`${api}/today`)
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
