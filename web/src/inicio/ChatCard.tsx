import { Link } from 'react-router-dom'
import { Button, Card } from '../components'
import { ChatIcon, SendIcon } from '../chat/icons'
import { CHAT } from '../chat/section'
import { whenUpdated } from './format'
import type { CardState, ChatCardData } from './useInicio'

// The chat, across the whole row: the latest conversations to pick up again.
function ChatCard({ state }: { state: CardState<ChatCardData> }) {
  const recent = state.status === 'ready' ? state.data.recent : []
  const isNew = state.status === 'ready' && recent.length === 0

  return (
    <Card className="dash-card dash-card--wide">
      <div className="dash-chat">
        <div className="dash-chat-intro">
          <span className="dash-label dash-label--chat">
            <ChatIcon width={22} height={22} />
            Chat
          </span>
          <h2>{isNew ? 'Empieza a platicar' : 'Retoma donde te quedaste'}</h2>
          <p>
            {isNew
              ? 'Pregúntame lo que quieras: el clima, tus pendientes, una idea.'
              : 'Tus conversaciones más recientes, o empieza una nueva.'}
          </p>
          <Button as={Link} to={CHAT.path} variant="primary" className="dash-action">
            Nueva conversación
          </Button>
        </div>

        <div className="dash-chat-list">
          {state.status === 'loading' &&
            Array.from({ length: 3 }, (_, i) => <span key={i} className="dash-skeleton dash-skeleton--row" />)}
          {state.status === 'error' && <p className="dash-error">{state.message}</p>}
          {state.status === 'ready' && recent.length > 0 && (
            <ul>
              {recent.map((c) => (
                <li key={c.id}>
                  <Link to={`${CHAT.path}/${c.id}`} className="dash-row">
                    <span className="dash-row-text">
                      <strong>{c.title}</strong>
                      <span>{whenUpdated(c.updatedAt)}</span>
                    </span>
                    <SendIcon className="dash-row-arrow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ChatCard
