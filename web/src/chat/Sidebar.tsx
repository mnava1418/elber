import { useEffect, useRef } from 'react'
import type { ConversationSummary } from './history'
import { NewChatIcon, PanelIcon, PlusIcon, TrashIcon } from './icons'
import { groupByDate, type ListStatus } from './useConversations'

interface Props {
  conversations: ConversationSummary[]
  status: ListStatus
  hasMore: boolean
  /** La conversación en pantalla. */
  activeId?: string
  onOpen: () => void
  onClose: () => void
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (conversation: ConversationSummary) => void
  onLoadMore: () => void
  onRetry: () => void
}

export function Sidebar({ conversations, status, hasMore, activeId, onOpen, onClose, onNew, onSelect, onDelete, onLoadMore, onRetry }: Props) {
  const sentinel = useRef<HTMLDivElement>(null)
  // After an error, only the Reintentar button loads again (no retry loop).
  const autoLoad = hasMore && status === 'idle'

  // Next page when the end of the list scrolls into view. Observing again
  // after each page also catches a sentinel that never left the view.
  useEffect(() => {
    const el = sentinel.current
    if (!el || !autoLoad) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore())
    observer.observe(el)
    return () => observer.disconnect()
  }, [autoLoad, onLoadMore])

  return (
    <aside className="chat-sidebar" aria-label="Conversaciones">
      <div className="chat-rail">
        <button type="button" className="chat-icon-btn" aria-label="Abrir conversaciones" onClick={onOpen}>
          <PanelIcon />
        </button>
        <button type="button" className="chat-icon-btn" aria-label="Nueva conversación" onClick={onNew}>
          <NewChatIcon />
        </button>
      </div>
      <div className="chat-panel">
        <div className="chat-panel-head">
          <span>Conversaciones</span>
          <button type="button" className="chat-icon-btn" aria-label="Cerrar panel" onClick={onClose}>
            <PanelIcon />
          </button>
        </div>
        <button type="button" className="chat-panel-new" onClick={onNew}>
          <PlusIcon />
          Nueva conversación
        </button>
        <nav className="chat-panel-list" aria-label="Historial">
          {groupByDate(conversations).map((group) => (
            <section key={group.label} className="chat-panel-section">
              <span className="chat-panel-group">{group.label}</span>
              {group.items.map((c) => (
                <div key={c.id} className="chat-panel-row" aria-current={c.id === activeId ? 'page' : undefined}>
                  <button type="button" className="chat-panel-item" title={c.title} onClick={() => onSelect(c.id)}>
                    {c.title}
                  </button>
                  <button type="button" className="chat-panel-delete" aria-label={`Borrar «${c.title}»`} onClick={() => onDelete(c)}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </section>
          ))}

          {status === 'loading' && <span className="chat-panel-note">Cargando…</span>}
          {status === 'idle' && conversations.length === 0 && <span className="chat-panel-note">Aún no tienes conversaciones.</span>}
          {status === 'error' && (
            <span className="chat-panel-note">
              No se pudieron cargar.{' '}
              <button type="button" className="chat-panel-retry" onClick={conversations.length ? onLoadMore : onRetry}>
                Reintentar
              </button>
            </span>
          )}
          {autoLoad && <div ref={sentinel} className="chat-panel-sentinel" aria-hidden="true" />}
        </nav>
      </div>
    </aside>
  )
}
