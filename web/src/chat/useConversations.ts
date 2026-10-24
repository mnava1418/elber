import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteAllConversations, deleteConversation, listConversations, type ConversationSummary } from './history'

export type ListStatus = 'loading' | 'idle' | 'error'

/**
 * The sidebar's conversations, most recently updated first, a page at a
 * time. What happens in the chat (a new conversation, a new message) is
 * applied here by hand instead of fetching the list again.
 */
export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [status, setStatus] = useState<ListStatus>('loading')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  // A first-page reload drops a page still on its way.
  const request = useRef(0)

  // Callers set status to 'loading' first (it starts as 'loading').
  const fetchPage = useCallback(async (cursor?: string) => {
    const id = ++request.current
    try {
      const page = await listConversations(cursor)
      if (id !== request.current) return
      setConversations((cs) => {
        if (!cursor) return page.conversations
        // A conversation can move between pages while paging: keep one copy.
        const seen = new Set(cs.map((c) => c.id))
        return [...cs, ...page.conversations.filter((c) => !seen.has(c.id))]
      })
      setNextCursor(page.nextCursor)
      setStatus('idle')
    } catch {
      if (id === request.current) setStatus('error')
    }
  }, [])

  useEffect(() => {
    // Its state updates come after the await, not during the effect.
    // oxlint-disable-next-line react/set-state-in-effect
    fetchPage()
  }, [fetchPage])

  const reload = useCallback(() => {
    setStatus('loading')
    fetchPage()
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (!nextCursor || status === 'loading') return
    setStatus('loading')
    fetchPage(nextCursor)
  }, [fetchPage, nextCursor, status])

  /** Moves the conversation to the top (adding it if it's new). */
  const touch = useCallback((id: string, title?: string) => {
    setConversations((cs) => {
      const existing = cs.find((c) => c.id === id)
      const now = new Date().toISOString()
      const updated = existing
        ? { ...existing, updatedAt: now }
        : { id, title: title ?? 'Nueva conversación', createdAt: now, updatedAt: now }
      return [updated, ...cs.filter((c) => c.id !== id)]
    })
  }, [])

  /** Rejects if the backend could not delete it; the list stays as it was. */
  const remove = useCallback(async (id: string) => {
    await deleteConversation(id)
    setConversations((cs) => cs.filter((c) => c.id !== id))
  }, [])

  /** Rejects if the backend could not delete them; the list stays as it was. */
  const removeAll = useCallback(async () => {
    await deleteAllConversations()
    // Pages still on their way would bring deleted ones back.
    request.current++
    setConversations([])
    setNextCursor(null)
    setStatus('idle')
  }, [])

  return { conversations, status, hasMore: nextCursor !== null, reload, loadMore, touch, remove, removeAll }
}

const DAY = 24 * 60 * 60 * 1000

// Groups by local calendar day, as the sidebar shows them.
export function groupByDate(conversations: ConversationSummary[], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const label = (iso: string) => {
    const t = new Date(iso).getTime()
    if (t >= today) return 'Hoy'
    if (t >= today - DAY) return 'Ayer'
    if (t >= today - 7 * DAY) return 'Últimos 7 días'
    if (t >= today - 30 * DAY) return 'Últimos 30 días'
    return 'Anteriores'
  }
  const groups: { label: string; items: ConversationSummary[] }[] = []
  for (const c of conversations) {
    const l = label(c.updatedAt)
    const last = groups.at(-1)
    if (last?.label === l) last.items.push(c)
    else groups.push({ label: l, items: [c] })
  }
  return groups
}
