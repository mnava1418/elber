import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Logo } from '../components'
import { useAuth } from '../context/useAuth'
import { useChatSocket, type ChatStatus } from '../hooks/useChatSocket'
import { signOutUser } from '../services/auth.service'
import '../styles/Dashboard.css'

const STATUS_LABEL: Record<ChatStatus, string> = {
  connecting: 'Conectando…',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  error: 'Sin conexión',
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { status, error, messages, sendHello } = useChatSocket()
  const [text, setText] = useState('')

  async function handleSignOut() {
    await signOutUser()
    navigate('/login')
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    sendHello(trimmed)
    setText('')
  }

  return (
    <main className="dashboard">
      <Card className="dashboard-card">
        <Logo size="md" />
        <h1>Bienvenido{user?.email ? `, ${user.email}` : ''}</h1>

        {/* Temporary: tests the /chat socket until the real chat exists. */}
        <p className={`chat-status chat-status--${status}`} role="status">
          <span className="chat-status-dot" aria-hidden="true" />
          {STATUS_LABEL[status]}
        </p>
        {error && <p className="chat-error">{error}</p>}

        <ul className="chat-messages" aria-live="polite">
          {messages.map((message) => (
            <li key={message.id} className={`chat-message chat-message--${message.from}`}>
              {message.text}
            </li>
          ))}
        </ul>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            aria-label="Mensaje para Elber"
            placeholder="Escribe algo…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="submit" disabled={status !== 'connected' || !text.trim()}>
            Enviar
          </Button>
        </form>

        <Button variant="ghost" onClick={handleSignOut}>
          Cerrar sesión
        </Button>
      </Card>
    </main>
  )
}

export default Dashboard
