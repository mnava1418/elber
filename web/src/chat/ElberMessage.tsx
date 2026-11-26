import { useState } from 'react'
import elber from '../assets/elber.webp'
import elberHappy from '../assets/elber_happy.webp'
import elberThinking from '../assets/elber_thinking.webp'
import elberSurprise from '../assets/elber_surprise.webp'
import { Button } from '../components'
import { Markdown } from './Markdown'
import { Widgets } from './widgets/Widgets'
import type { ElberTurn, Source, ToolStep } from './types'
import { AlertIcon, BookmarkIcon, BugIcon, JournalIcon, CheckIcon, ChevronIcon, CloudIcon, CopyIcon, DumbbellIcon, GlobeIcon, PageIcon, NoteIcon, RefreshIcon, TodoIcon } from './icons'

const MASCOT = { thinking: elberThinking, streaming: elber, done: elberHappy, stopped: elber, error: elberSurprise }
const LABEL = {
  search: 'Buscando en la web',
  read: 'Leyendo una página',
  weather: 'Consultando el clima',
  remember: 'Recordando',
  forget: 'Olvidando',
  add_todo: 'Agregando pendiente',
  complete_todo: 'Completando',
  list_todos: 'Revisando tus pendientes',
  save_note: 'Guardando nota',
  search_notes: 'Buscando en tus notas',
  read_note: 'Leyendo nota',
  update_note: 'Actualizando nota',
  link_notes: 'Enlazando notas',
  report_bug: 'Reportando el bug',
  save_entry: 'Guardando en tu diario',
  read_month: 'Leyendo tu diario',
  list_months: 'Revisando tu diario',
  get_coaching_guide: 'Repasando cómo entrenarte',
  get_training_profile: 'Revisando tu perfil de entrenamiento',
  update_training_profile: 'Actualizando tu perfil de entrenamiento',
  get_plans: 'Revisando tus planes',
  create_plan: 'Guardando tu plan',
  update_plan: 'Actualizando tu plan',
  get_training_progress: 'Revisando tu progreso',
}
const ICON = {
  search: GlobeIcon,
  read: PageIcon,
  weather: CloudIcon,
  remember: BookmarkIcon,
  forget: BookmarkIcon,
  add_todo: TodoIcon,
  complete_todo: TodoIcon,
  list_todos: TodoIcon,
  save_note: NoteIcon,
  search_notes: NoteIcon,
  read_note: NoteIcon,
  update_note: NoteIcon,
  link_notes: NoteIcon,
  report_bug: BugIcon,
  save_entry: JournalIcon,
  read_month: JournalIcon,
  list_months: JournalIcon,
  get_coaching_guide: DumbbellIcon,
  get_training_profile: DumbbellIcon,
  update_training_profile: DumbbellIcon,
  get_plans: DumbbellIcon,
  create_plan: DumbbellIcon,
  update_plan: DumbbellIcon,
  get_training_progress: DumbbellIcon,
}

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
              {LABEL[s.kind]}
              {s.detail && <>: <span className="step-detail">{s.detail}</span></>}
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
  const added = steps.filter((s) => s.kind === 'add_todo').length
  const completed = steps.filter((s) => s.kind === 'complete_todo').length
  const listed = steps.some((s) => s.kind === 'list_todos')
  const saved = steps.filter((s) => s.kind === 'save_note').length
  const searchedNotes = steps.some((s) => s.kind === 'search_notes')
  const readNotes = steps.filter((s) => s.kind === 'read_note').length
  const updated = steps.filter((s) => s.kind === 'update_note').length
  const linked = steps.filter((s) => s.kind === 'link_notes').length
  const reported = steps.filter((s) => s.kind === 'report_bug').length
  const savedEntry = steps.some((s) => s.kind === 'save_entry')
  const readMonths = steps.filter((s) => s.kind === 'read_month').length
  const listedMonths = steps.some((s) => s.kind === 'list_months')
  // The coach's reads are one idea for the user: Elber looked at their training.
  const readTraining = steps.some((s) => ['get_coaching_guide', 'get_training_profile', 'get_plans', 'get_training_progress'].includes(s.kind))
  const updatedProfile = steps.some((s) => s.kind === 'update_training_profile')
  const createdPlan = steps.some((s) => s.kind === 'create_plan')
  const updatedPlan = steps.some((s) => s.kind === 'update_plan')
  const parts: string[] = []
  if (weather) parts.push(weather === 1 ? 'consultó el clima' : `consultó el clima ${weather} veces`)
  if (searches) parts.push(searches === 1 ? 'buscó en la web' : `hizo ${searches} búsquedas`)
  if (reads) parts.push(reads === 1 ? 'leyó 1 página' : `leyó ${reads} páginas`)
  if (remembered) parts.push(remembered === 1 ? 'guardó 1 dato' : `guardó ${remembered} datos`)
  if (forgotten) parts.push(forgotten === 1 ? 'olvidó 1 dato' : `olvidó ${forgotten} datos`)
  if (listed) parts.push('revisó tus pendientes')
  if (added) parts.push(added === 1 ? 'agregó 1 pendiente' : `agregó ${added} pendientes`)
  if (completed) parts.push(completed === 1 ? 'completó 1 pendiente' : `completó ${completed} pendientes`)
  if (searchedNotes) parts.push('buscó en tus notas')
  if (readNotes) parts.push(readNotes === 1 ? 'leyó 1 nota' : `leyó ${readNotes} notas`)
  if (saved) parts.push(saved === 1 ? 'guardó 1 nota' : `guardó ${saved} notas`)
  if (updated) parts.push(updated === 1 ? 'actualizó 1 nota' : `actualizó ${updated} notas`)
  if (linked) parts.push(linked === 1 ? 'enlazó 2 notas' : `hizo ${linked} enlaces`)
  if (reported) parts.push(reported === 1 ? 'reportó 1 bug' : `reportó ${reported} bugs`)
  if (listedMonths) parts.push('revisó tu diario')
  if (readMonths) parts.push(readMonths === 1 ? 'leyó 1 mes de tu diario' : `leyó ${readMonths} meses de tu diario`)
  if (savedEntry) parts.push('guardó tu diario')
  if (readTraining) parts.push('revisó tu entrenamiento')
  if (updatedProfile) parts.push('actualizó tu perfil de entrenamiento')
  if (createdPlan) parts.push('guardó tu plan')
  if (updatedPlan) parts.push('actualizó tu plan')
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
