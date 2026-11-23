import { useState } from 'react'
import { Button, Card } from '../components'
import { CheckIcon } from '../chat/icons'
import type { TrainingSummary } from './api'
import type { TrainingPlan } from './plan'

// Any training that isn't one of the plan's routines.
const OTHER = 'other'

interface Props {
  summary: TrainingSummary
  plan: TrainingPlan | null
  busy: boolean
  onMark: (routineId: string | null) => void
  onUnmark: () => void
}

// Today: what the rotation suggests and the button to mark the day trained.
export function TodayCard({ summary, plan, busy, onMark, onUnmark }: Props) {
  const { todaySession, nextRoutine } = summary
  // The suggestion is preselected; the user may do another routine.
  const [choice, setChoice] = useState(nextRoutine?.id ?? OTHER)
  const routines = plan?.routines ?? []

  if (todaySession) {
    return (
      <Card className="tr-card tr-today tr-today--done">
        <span className="tr-kicker">Hoy</span>
        <p className="tr-today-title">
          <CheckIcon width={20} height={20} className="tr-today-check" />
          {todaySession.routineName ? `Entrenaste ${todaySession.routineName}` : 'Entrenaste hoy'}
        </p>
        <Button variant="ghost" className="tr-btn-sm" disabled={busy} onClick={onUnmark}>
          Desmarcar
        </Button>
      </Card>
    )
  }

  return (
    <Card className="tr-card tr-today">
      <span className="tr-kicker">Hoy</span>
      <p className="tr-today-title">{nextRoutine ? `Te toca ${nextRoutine.name}` : '¿Entrenaste hoy?'}</p>

      {routines.length > 0 && (
        <fieldset className="tr-choices">
          <legend>¿Qué hiciste?</legend>
          {[...routines.map((r) => ({ id: r.id, name: r.name })), { id: OTHER, name: 'Otro entrenamiento' }].map((r) => (
            <label key={r.id} className={`tr-choice${choice === r.id ? ' tr-choice--on' : ''}`}>
              <input type="radio" name="routine" value={r.id} checked={choice === r.id} onChange={() => setChoice(r.id)} />
              {r.name}
            </label>
          ))}
        </fieldset>
      )}

      <Button disabled={busy} onClick={() => onMark(choice === OTHER ? null : choice)}>
        Marcar como entrenado
      </Button>
    </Card>
  )
}
