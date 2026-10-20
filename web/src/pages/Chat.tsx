import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import elberHappy from '../assets/elber_happy.webp'
import elber from '../assets/elber.webp'
import elberSurprise from '../assets/elber_surprise.webp'
import { ChatHeader } from '../chat/ChatHeader'
import { Composer } from '../chat/Composer'
import { ElberMessage } from '../chat/ElberMessage'
import { mockTransport, socketIoTransport } from '../chat/transport'
import { useChat } from '../chat/useChat'
import { NewChatIcon, PanelIcon, PlusIcon, WifiOffIcon } from '../chat/icons'
import { Button } from '../components'
import { useAuth } from '../context/useAuth'
import { signOutUser } from '../services/auth.service'
import '../styles/Chat.css'

// VITE_CHAT_MOCK=true answers with a canned demo: handy to work on the UI
// without the backend (and without spending API credits).
const transport = import.meta.env.VITE_CHAT_MOCK === 'true' ? mockTransport : socketIoTransport

const SUGGESTIONS = [
  '¿Qué tiempo hará este fin de semana en CDMX?',
  'Resume las noticias de tecnología de hoy',
  'Ayúdame a planear mi semana',
  'Explícame qué es un webhook',
]

function Chat() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const email = authUser?.email ?? ''
  // Accounts without a display name show the part of the email before the @.
  const user = { name: authUser?.displayName || email.split('@')[0] || 'tú', email }
  const { turns, connection, retryIn, responding, send, stop, retry, reconnectNow, reset } = useChat(transport)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const stick = useRef(true)

  useLayoutEffect(() => {
    const el = scroller.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [turns])

  function handleSend(text: string) {
    stick.current = true
    send(text)
  }

  async function handleLogout() {
    await signOutUser()
    navigate('/login')
  }

  const firstQuestion = turns.find((t) => t.role === 'user')?.text
  const canRetry = connection === 'open' && !responding

  return (
    <div className={`chat${sidebarOpen ? ' chat--sidebar-open' : ''}`}>
      <div className="chat-glow" aria-hidden="true" />
      <span className="chat-spark chat-spark--1" aria-hidden="true" />
      <span className="chat-spark chat-spark--2" aria-hidden="true" />
      <span className="chat-spark chat-spark--3" aria-hidden="true" />

      <div className="chat-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <aside className="chat-sidebar" aria-label="Conversaciones">
        <div className="chat-rail">
          <button type="button" className="chat-icon-btn" aria-label="Abrir conversaciones" onClick={() => setSidebarOpen(true)}>
            <PanelIcon />
          </button>
          <button type="button" className="chat-icon-btn" aria-label="Nueva conversación" onClick={reset}>
            <NewChatIcon />
          </button>
        </div>
        <div className="chat-panel">
          <div className="chat-panel-head">
            <span>Conversaciones</span>
            <button type="button" className="chat-icon-btn" aria-label="Cerrar panel" onClick={() => setSidebarOpen(false)}>
              <PanelIcon />
            </button>
          </div>
          <button
            type="button"
            className="chat-panel-new"
            onClick={() => {
              reset()
              setSidebarOpen(false)
            }}
          >
            <PlusIcon />
            Nueva conversación
          </button>
          <div className="chat-panel-list">
            <span className="chat-panel-group">Hoy</span>
            <div className="chat-panel-item" aria-current="true">
              {firstQuestion ?? 'Nueva conversación'}
            </div>
          </div>
        </div>
      </aside>

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

        {turns.length === 0 ? (
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
                    Hola, <span className="gradient-text">{user.name.split(' ')[0]}</span>. ¿En qué te ayudo hoy?
                  </h1>
                  <p>Pregúntame lo que quieras. Puedo buscar en la web, leer páginas y ayudarte a organizar tu día.</p>
                </div>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((s) => (
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
                  <ElberMessage key={t.id} turn={t} canRetry={canRetry} onRetry={retry} />
                ),
              )}
            </div>
          </div>
        )}

        <Composer connection={connection} responding={responding} onSend={handleSend} onStop={stop} />
      </div>

      {connection === 'rejected' && (
        <div className="chat-dialog-backdrop">
          <div className="chat-dialog" role="alertdialog" aria-modal="true" aria-labelledby="session-title">
            <img src={elberSurprise} alt="" className="chat-dialog-mascot" />
            <h2 id="session-title">Tu sesión ya no es válida</h2>
            <p>Inicia sesión otra vez para seguir hablando con Elber.</p>
            {/* Signs out first: /login sends signed-in users back to /chat. */}
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
