import { apiGetAuth } from '../lib/api'

// Contract of the backend's chat history (GET <section>/conversations).
// `api` is the section's path (/chat, /diary). Copy of web/src/chat/history.ts:
// change both together. Only what Inicio needs so far; the rest (a whole
// conversation, rename, delete) comes with the chat's history (phase 7).
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

// The query string by hand: React Native's URLSearchParams doesn't implement set().
export function conversationsQuery(cursor?: string, limit?: number) {
  const params: string[] = []
  if (cursor) params.push(`cursor=${encodeURIComponent(cursor)}`)
  if (limit) params.push(`limit=${limit}`)
  return params.length ? `?${params.join('&')}` : ''
}

// Most recently updated first. Without `limit` the backend's default page size.
export function listConversations(api: string, cursor?: string, limit?: number): Promise<ConversationPage> {
  return apiGetAuth(`${api}/conversations${conversationsQuery(cursor, limit)}`)
}

/** In a daily section (the diary): which conversation is today's. The backend decides when the day changes. */
export function getToday(api: string): Promise<{ id: string; title: string }> {
  return apiGetAuth(`${api}/today`)
}
