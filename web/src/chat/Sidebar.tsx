import { useEffect, useRef, useState } from 'react'
import { MAX_TITLE_LENGTH, type ConversationSummary } from './history'
import { EditIcon, NewChatIcon, PanelIcon, PlusIcon, TrashIcon } from './icons'
import { groupByDate, type ListStatus } from './useConversations'

interface Props {
  conversations: ConversationSummary[]
  status: ListStatus
  hasMore: boolean
  /** The conversation on screen. */
  activeId?: string
  onOpen: () => void
  onClose: () => void
  /** Left out where there is no new conversation (the diary: one per day). */
  onNew?: () => void
  onSelect: (id: string) => void
  /** Rejects if it could not be renamed. */
  onRename: (id: string, title: string) => Promise<void>
  onDelete: (conversation: ConversationSummary) => void
  onDeleteAll: () => void
  onLoadMore: () => void
  onRetry: () => void
}

export function Sidebar({ conversations, status, hasMore, activeId, onOpen, onClose, onNew, onSelect, onRename, onDelete, onDeleteAll, onLoadMore, onRetry }: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
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
        {onNew && (
          <button type="button" className="chat-icon-btn" aria-label="Nueva conversación" onClick={onNew}>
            <NewChatIcon />
          </button>
        )}
      </div>
      <div className="chat-panel">
        <div className="chat-panel-head">
          <span>Conversaciones</span>
          <button type="button" className="chat-icon-btn" aria-label="Cerrar panel" onClick={onClose}>
            <PanelIcon />
          </button>
        </div>
        {onNew && (
          <button type="button" className="chat-panel-new" onClick={onNew}>
            <PlusIcon />
            Nueva conversación
          </button>
        )}
        <nav className="chat-panel-list" aria-label="Historial">
          {groupByDate(conversations).map((group) => (
            <section key={group.label} className="chat-panel-section">
              <span className="chat-panel-group">{group.label}</span>
              {group.items.map((c) => (
                <div key={c.id} className="chat-panel-row" aria-current={c.id === activeId ? 'page' : undefined}>
                  {renamingId === c.id ? (
                    <TitleField title={c.title} onSave={(title) => onRename(c.id, title)} onDone={() => setRenamingId(null)} />
                  ) : (
                    <>
                      <button type="button" className="chat-panel-item" title={c.title} onClick={() => onSelect(c.id)}>
                        {c.title}
                      </button>
                      <button type="button" className="chat-panel-action" aria-label={`Renombrar «${c.title}»`} onClick={() => setRenamingId(c.id)}>
                        <EditIcon />
                      </button>
                      <button type="button" className="chat-panel-action chat-panel-action--danger" aria-label={`Borrar «${c.title}»`} onClick={() => onDelete(c)}>
                        <TrashIcon />
                      </button>
                    </>
                  )}
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
        {conversations.length > 0 && (
          <button type="button" className="chat-panel-clear" onClick={onDeleteAll}>
            <TrashIcon />
            Borrar todas
          </button>
        )}
      </div>
    </aside>
  )
}

interface TitleFieldProps {
  title: string
  onSave: (title: string) => Promise<void>
  /** Saved, unchanged or cancelled: back to the plain row. */
  onDone: () => void
}

/** Edits a conversation's title in its row: Enter or leaving saves, Escape cancels. */
function TitleField({ title, onSave, onDone }: TitleFieldProps) {
  const [draft, setDraft] = useState(title)
  const [status, setStatus] = useState<'editing' | 'saving' | 'error'>('editing')
  // Escape and Enter also blur the field: the first one decides.
  const finished = useRef(false)
  const input = useRef<HTMLInputElement>(null)

  // Saving disables the field, which loses focus: get it back to retry.
  useEffect(() => {
    if (status === 'error') input.current?.focus()
  }, [status])

  async function save() {
    if (finished.current || status === 'saving') return
    const clean = draft.replace(/\s+/g, ' ').trim()
    if (clean === '' || clean === title) {
      finished.current = true
      onDone()
      return
    }
    setStatus('saving')
    try {
      await onSave(clean)
      finished.current = true
      onDone()
    } catch {
      // Stays open so the title isn't lost; Escape gives up.
      setStatus('error')
    }
  }

  function cancel() {
    finished.current = true
    onDone()
  }

  return (
    <form
      className="chat-panel-rename"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <input
        ref={input}
        className="chat-panel-input"
        value={draft}
        maxLength={MAX_TITLE_LENGTH}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Nuevo título"
        aria-invalid={status === 'error'}
        title={status === 'error' ? 'No se pudo renombrar. Enter para reintentar, Esc para cancelar.' : undefined}
        disabled={status === 'saving'}
        onChange={(e) => {
          setDraft(e.target.value)
          if (status === 'error') setStatus('editing')
        }}
        onKeyDown={(e) => e.key === 'Escape' && cancel()}
        onBlur={save}
      />
    </form>
  )
}
