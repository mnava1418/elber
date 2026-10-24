import { useState } from 'react'
import elber from '../assets/elber.webp'
import elberHappy from '../assets/elber_happy.webp'
import elberThinking from '../assets/elber_thinking.webp'
import elberSurprise from '../assets/elber_surprise.webp'
import { Button } from '../components'
import { Markdown } from './Markdown'
import { Widgets } from './widgets/Widgets'
import type { ElberTurn, Source, ToolStep } from './types'
import { AlertIcon, BookmarkIcon, CheckIcon, ChevronIcon, CloudIcon, CopyIcon, GlobeIcon, PageIcon, RefreshIcon } from './icons'

const MASCOT = { thinking: elberThinking, streaming: elber, done: elberHappy, stopped: elber, error: elberSurprise }
const LABEL = {
  search: 'Buscando en la web',
  read: 'Leyendo una página',
  weather: 'Consultando el clima',
  remember: 'Recordando',
  forget: 'Olvidando',
}
const ICON = { search: GlobeIcon, read: PageIcon, weather: CloudIcon, remember: BookmarkIcon, forget: BookmarkIcon }

function ToolSteps({ steps }: { steps: ToolStep[] }) {
  return (
    <ol className="steps" aria-label="Pasos de Elber">
      {steps.map((s) => {
        const Icon = ICON[s.kind]
        return (
          <li key={s.id} className={`step${s.status === 'running' ? ' step--running' : ''}`}>
            <span className="step-icon">
              <Icon />
            </span>
            <span className="step-text">
              {LABEL[s.kind]}: <span className="step-detail">{s.detail}</span>
            </span>
            {s.status === 'running' ? <span className="step-spinner" aria-label="En curso" /> : <CheckIcon className="step-check" aria-label="Listo" />}
          </li>
        )
      })}
    </ol>
  )
}

function stepsSummary(steps: ToolStep[]) {
  const searches = steps.filter((s) => s.kind === 'search').length
  const reads = steps.filter((s) => s.kind === 'read').length
  const weather = steps.filter((s) => s.kind === 'weather').length
  const remembered = steps.filter((s) => s.kind === 'remember').length
  const forgotten = steps.filter((s) => s.kind === 'forget').length
  const parts: string[] = []
  if (weather) parts.push(weather === 1 ? 'consultó el clima' : `consultó el clima ${weather} veces`)
  if (searches) parts.push(searches === 1 ? 'buscó en la web' : `hizo ${searches} búsquedas`)
  if (reads) parts.push(reads === 1 ? 'leyó 1 página' : `leyó ${reads} páginas`)
  if (remembered) parts.push(remembered === 1 ? 'guardó 1 dato' : `guardó ${remembered} datos`)
  if (forgotten) parts.push(forgotten === 1 ? 'olvidó 1 dato' : `olvidó ${forgotten} datos`)
  const desc = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}` : parts.join('')
  return `${steps.length === 1 ? '1 paso' : `${steps.length} pasos`} · ${desc.charAt(0).toUpperCase()}${desc.slice(1)}`
}

function Sources({ sources }: { sources: Source[] }) {
  return (
    <nav className="sources" aria-label="Fuentes">
      <span className="sources-label">Fuentes</span>
      <ul>
        {sources.map((s) => (
          <li key={s.n}>
            <a href={s.url} target="_blank" rel="noreferrer">
              <span className="source-n">{s.n}</span>
              <span className="source-text">
                <span className="source-domain">{new URL(s.url).hostname.replace(/^www\./, '')}</span>
                <span className="source-title">{s.title}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

interface Props {
  turn: ElberTurn
  canRetry: boolean
  onRetry: (id: string) => void
}

export function ElberMessage({ turn, canRetry, onRetry }: Props) {
  const [showSteps, setShowSteps] = useState(false)
  const { status, steps, text, sources, widgets } = turn
  const live = status === 'thinking' || status === 'streaming'
  const toolRunning = steps.some((s) => s.status === 'running')

  return (
    <article className={`turn-elber turn-elber--${status}`} aria-busy={live}>
      <header className="turn-elber-head">
        <span className="elber-avatar">
          <img src={MASCOT[status]} alt="" />
        </span>
        <span className="turn-elber-name">Elber</span>
      </header>

      {steps.length > 0 && !live && (
        <button type="button" className="steps-summary" aria-expanded={showSteps} onClick={() => setShowSteps((v) => !v)}>
          <CheckIcon className="step-check" />
          {stepsSummary(steps)}
          <ChevronIcon className="steps-chevron" />
        </button>
      )}
      {steps.length > 0 && (live || showSteps) && <ToolSteps steps={steps} />}

      {status === 'thinking' && !toolRunning && !text && (
        <div className="thinking" role="status">
          <span className="thinking-dots" aria-hidden="true"><span /><span /><span /></span>
          Pensando…
        </div>
      )}

      {widgets.length > 0 && <Widgets widgets={widgets} />}

      {text && <Markdown text={text} sources={sources} state={status === 'streaming' ? 'streaming' : status === 'stopped' ? 'stopped' : undefined} />}

      {status === 'done' && sources.length > 0 && <Sources sources={sources} />}

      {status === 'done' && (
        <div className="turn-actions">
          <button type="button" aria-label="Copiar respuesta" onClick={() => navigator.clipboard.writeText(text)}>
            <CopyIcon width={16} height={16} />
          </button>
        </div>
      )}

      {status === 'stopped' && (
        <div className="turn-stopped">
          <span className="turn-stopped-label">
            <span className="turn-stopped-square" aria-hidden="true" />
            Respuesta detenida
          </span>
          <Button type="button" variant="ghost" className="chat-btn-sm" disabled={!canRetry} onClick={() => onRetry(turn.id)}>
            <RefreshIcon width={13} height={13} />
            Regenerar
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="turn-error" role="alert">
          <span className="turn-error-text">
            <AlertIcon />
            {turn.retryAfter
              ? `Llegaste al límite de mensajes. Inténtalo de nuevo en ${Math.ceil(turn.retryAfter / 60)} min.`
              : 'Elber no pudo responder, inténtalo de nuevo.'}
          </span>
          <button type="button" className="turn-error-retry" disabled={!canRetry} onClick={() => onRetry(turn.id)}>
            <RefreshIcon />
            Reintentar
          </button>
        </div>
      )}
    </article>
  )
}
