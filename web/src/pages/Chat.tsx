import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import elberHappy from '../assets/elber_happy.webp'
import elber from '../assets/elber.webp'
import elberSurprise from '../assets/elber_surprise.webp'
import { ChatHeader } from '../chat/ChatHeader'
import { Composer } from '../chat/Composer'
import { ElberMessage } from '../chat/ElberMessage'
import { getConversation, getToday, toTurns, type ConversationSummary } from '../chat/history'
import type { ChatSection } from '../chat/section'
import { Sidebar } from '../chat/Sidebar'
import { useChat } from '../chat/useChat'
import { useConversations } from '../chat/useConversations'
import { WifiOffIcon } from '../chat/icons'
import { Button } from '../components'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../lib/api'
import { signOutUser } from '../services/auth.service'
import '../styles/Chat.css'

// Loading a saved conversation (the one in the URL).
type LoadState = 'idle' | 'loading' | 'not_found' | 'error'

// On phones the sidebar is a drawer over the chat: close it after picking.
const isDrawer = () => window.matchMedia('(max-width: 640px)').matches

// The page of a chat section (the chat, the diary). App.tsx gives each one
// its own key, so moving between sections starts from scratch.
function Chat({ section }: { section: ChatSection }) {
  const { path, api, daily, transport } = section
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const email = authUser?.email ?? ''
  // Accounts without a display name show the part of the email before the @.
  const user = { name: authUser?.displayName || email.split('@')[0] || 'tú', email }
  // The URL decides which conversation is on screen: /chat is a new one, and
  // /diario is today's.
  const { conversationId: routeId } = useParams()
  const history = useConversations(api)
  const { touch } = history
  const onConversation = useCallback(
    (id: string, title: string) => {
      touch(id, title)
      // Same screen, now with its address: no reload (see the effect below).
      navigate(`${path}/${id}`, { replace: true })
    },
    [navigate, touch, path],
  )
  const { turns, conversation, connection, retryIn, responding, send, stop, retry, reconnectNow, reset, show, currentConversation } = useChat(
    transport,
    { onConversation },
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Why the conversation of this visit to the URL (location.key) didn't load.
  const location = useLocation()
  const [loadFailure, setLoadFailure] = useState<{ key: string; state: 'not_found' | 'error' } | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  // In the diary, today's conversation before its first message: there is
  // nothing to load yet, and the first message starts it.
  const [unstarted, setUnstarted] = useState<string | null>(null)
  const failed = loadFailure?.key === location.key ? loadFailure.state : null
  const loadState: LoadState = routeId
    ? routeId === conversation || routeId === unstarted
      ? 'idle'
      : (failed ?? 'loading')
    : daily
      ? (failed ?? 'loading')
      : 'idle'
  // What the delete dialog asks about: one conversation, or all of them.
  const [pendingDelete, setPendingDelete] = useState<ConversationSummary | 'all' | null>(null)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle')
  const scroller = useRef<HTMLDivElement>(null)
  const stick = useRef(true)

  useLayoutEffect(() => {
    const el = scroller.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [turns])

  // The diary opens on today: the backend says which day that is.
  useEffect(() => {
    if (!daily || routeId) return
    let cancelled = false
    const key = location.key
    getToday(api)
      .then((today) => {
        if (!cancelled) navigate(`${path}/${today.id}`, { replace: true })
      })
      .catch(() => {
        if (!cancelled) setLoadFailure({ key, state: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [daily, routeId, api, path, navigate, location.key, loadAttempt])

  // Follows the URL. When it already shows that conversation (e.g. the one
  // the first message just created) there is nothing to load.
  useEffect(() => {
    if ((routeId ?? null) === currentConversation()) return
    reset()
    if (!routeId) return
    let cancelled = false
    const key = location.key
    getConversation(api, routeId)
      .then((saved) => {
        if (cancelled) return
        stick.current = true
        show(saved.id, toTurns(saved.messages))
      })
      .catch(async (error: unknown) => {
        const notFound = error instanceof ApiError && error.status === 404
        // A missing diary day may just be today's, not started yet.
        if (notFound && daily) {
          const today = await getToday(api).catch(() => null)
          if (cancelled) return
          if (today?.id === routeId) {
            setUnstarted(routeId)
            return
          }
        }
        if (!cancelled) setLoadFailure({ key, state: notFound ? 'not_found' : 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [routeId, location.key, loadAttempt, reset, show, currentConversation, api, daily])

  function handleSend(text: string) {
    stick.current = true
    if (send(text) !== 'sent') return
    const id = currentConversation()
    if (id) touch(id)
  }

  // In the diary, back to today.
  function handleNew() {
    // Already at /chat with a conversation still being created: the URL
    // doesn't change, so reset here.
    reset()
    navigate(path)
    if (isDrawer()) setSidebarOpen(false)
  }

  function handleSelect(id: string) {
    navigate(`${path}/${id}`)
    if (isDrawer()) setSidebarOpen(false)
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleteStatus('deleting')
    try {
      if (pendingDelete === 'all') {
        await history.removeAll()
        if (routeId) navigate(path, { replace: true })
      } else {
        await history.remove(pendingDelete.id)
        if (pendingDelete.id === routeId) navigate(path, { replace: true })
      }
      setPendingDelete(null)
      setDeleteStatus('idle')
    } catch {
      setDeleteStatus('error')
    }
  }

  function closeDeleteDialog() {
    setPendingDelete(null)
    setDeleteStatus('idle')
  }

  async function handleLogout() {
    await signOutUser()
    navigate('/login')
  }

  const canRetry = connection === 'open' && !responding
  // Only the last answer can be retried (see useChat's retry).
  const lastTurnId = turns.at(-1)?.id

  return (
    <div className={`chat${sidebarOpen ? ' chat--sidebar-open' : ''}`}>
      <div className="chat-glow" aria-hidden="true" />
      <span className="chat-spark chat-spark--1" aria-hidden="true" />
      <span className="chat-spark chat-spark--2" aria-hidden="true" />
      <span className="chat-spark chat-spark--3" aria-hidden="true" />

      <div className="chat-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <Sidebar
        conversations={history.conversations}
        status={history.status}
        hasMore={history.hasMore}
        activeId={routeId}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        onNew={daily ? undefined : handleNew}
        onSelect={handleSelect}
        onRename={history.rename}
        onDelete={setPendingDelete}
        onDeleteAll={() => setPendingDelete('all')}
        onLoadMore={history.loadMore}
        onRetry={history.reload}
      />

      <div className="chat-main">
        <ChatHeader connection={connection} user={user} onOpenSidebar={() => setSidebarOpen(true)} onLogout={handleLogout} />

        {connection === 'reconnecting' && (
          <div className="chat-banner" role="status">
            <span>
              <WifiOffIcon />
              {retryIn > 0 ? `Sin conexión. Reintentando en ${retryIn} s…` : 'Sin conexión. Reintentando…'}
            </span>
            <button type="button" onClick={reconnectNow}>
              Reintentar ahora
            </button>
          </div>
        )}

        {loadState !== 'idle' ? (
          <div className="chat-empty">
            <div className="chat-empty-mascot">
              <img src={loadState === 'loading' ? elber : elberSurprise} alt="Elber" />
            </div>
            <div className="chat-empty-copy">
              {loadState === 'loading' && <h1>Cargando conversación…</h1>}
              {loadState === 'not_found' && (
                <>
                  <h1>{daily ? 'No encontré este día' : 'No encontré esta conversación'}</h1>
                  <p>{daily ? 'Puede que lo hayas borrado. Platícame de hoy cuando quieras.' : 'Puede que la hayas borrado. Empieza una nueva cuando quieras.'}</p>
                </>
              )}
              {loadState === 'error' && (
                <>
                  <h1>No pude cargar esta conversación</h1>
                  <p>Revisa tu conexión e inténtalo de nuevo.</p>
                </>
              )}
            </div>
            {loadState === 'not_found' && (
              <Button type="button" variant="primary" onClick={handleNew}>
                {daily ? 'Ir a hoy' : 'Nueva conversación'}
              </Button>
            )}
            {loadState === 'error' && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setLoadFailure(null)
                  setLoadAttempt((n) => n + 1)
                }}
              >
                Reintentar
              </Button>
            )}
          </div>
        ) : turns.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-mascot">
              <img src={connection === 'connecting' ? elber : elberHappy} alt="Elber" />
            </div>
            {connection === 'connecting' ? (
              <div className="chat-empty-copy">
                <h1>Conectando con Elber…</h1>
                <p>Esto toma solo un momento.</p>
              </div>
            ) : (
              <>
                <div className="chat-empty-copy">
                  <h1>
                    Hola, <span className="gradient-text">{user.name.split(' ')[0]}</span>. {section.greeting}
                  </h1>
                  <p>{section.intro}</p>
                </div>
                <div className="chat-suggestions">
                  {section.suggestions.map((s) => (
                    <button key={s} type="button" disabled={connection !== 'open'} onClick={() => handleSend(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className="chat-scroll"
            ref={scroller}
            onScroll={(e) => {
              const el = e.currentTarget
              stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
            }}
          >
            <div className="chat-thread" aria-live="polite">
              {turns.map((t) =>
                t.role === 'user' ? (
                  <div key={t.id} className="turn-user">
                    <div className="turn-user-bubble">{t.text}</div>
                  </div>
                ) : (
                  <ElberMessage key={t.id} turn={t} canRetry={canRetry && t.id === lastTurnId} onRetry={retry} />
                ),
              )}
            </div>
          </div>
        )}

        <Composer connection={connection} responding={responding} onSend={handleSend} onStop={stop} locked={loadState !== 'idle'} />
      </div>

      {pendingDelete && (
        <div className="chat-dialog-backdrop" onClick={closeDeleteDialog}>
          <div
            className="chat-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Escape' && closeDeleteDialog()}
          >
            <img src={elberSurprise} alt="" className="chat-dialog-mascot" />
            <h2 id="delete-title">{pendingDelete === 'all' ? '¿Borrar todas las conversaciones?' : '¿Borrar esta conversación?'}</h2>
            <p>
              {pendingDelete === 'all'
                ? 'Se borrarán todas tus conversaciones con sus mensajes. No se puede deshacer.'
                : `«${pendingDelete.title}» se borrará con todos sus mensajes. No se puede deshacer.`}
              {deleteStatus === 'error' && <span className="chat-dialog-error"> No se pudo borrar, inténtalo de nuevo.</span>}
            </p>
            <div className="chat-dialog-actions">
              <Button type="button" variant="ghost" size="lg" autoFocus onClick={closeDeleteDialog}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" size="lg" disabled={deleteStatus === 'deleting'} onClick={handleConfirmDelete}>
                {deleteStatus === 'deleting' ? 'Borrando…' : pendingDelete === 'all' ? 'Borrar todas' : 'Borrar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {connection === 'forbidden' && (
        <div className="chat-dialog-backdrop">
          <div className="chat-dialog" role="alertdialog" aria-modal="true" aria-labelledby="forbidden-title">
            <img src={elberSurprise} alt="" className="chat-dialog-mascot" />
            <h2 id="forbidden-title">Esta sección no está disponible</h2>
            <p>Tu cuenta no tiene acceso a ella.</p>
            <Button type="button" variant="primary" size="lg" className="chat-dialog-btn" autoFocus onClick={() => navigate('/inicio')}>
              Volver al inicio
            </Button>
          </div>
        </div>
      )}

      {connection === 'rejected' && (
        <div className="chat-dialog-backdrop">
          <div className="chat-dialog" role="alertdialog" aria-modal="true" aria-labelledby="session-title">
            <img src={elberSurprise} alt="" className="chat-dialog-mascot" />
            <h2 id="session-title">Tu sesión ya no es válida</h2>
            <p>Inicia sesión otra vez para seguir hablando con Elber.</p>
            {/* Signs out first: /login sends signed-in users back to /inicio. */}
            <Button type="button" variant="primary" size="lg" className="chat-dialog-btn" autoFocus onClick={handleLogout}>
              Volver a iniciar sesión
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
