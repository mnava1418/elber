import { useState } from 'react'
import { Button, Card } from '../components'
import { CheckIcon } from '../chat/icons'
import type { TrainingSession, TrainingSummary } from './api'
import { longDay, type TrainingPlan } from './plan'

// Any training that isn't one of the plan's routines.
const OTHER = 'other'

interface Props {
  date: string
  today: string
  session: TrainingSession | null
  plan: TrainingPlan | null
  nextRoutine: TrainingSummary['nextRoutine']
  busy: boolean
  onMark: (date: string, routineId: string | null) => void
  onUnmark: (date: string) => void
  onBackToToday: () => void
}

// One day, today unless another is picked in the calendar: mark it trained
// (with the routine done) or unmark it.
export function DayCard({ date, today, session, plan, nextRoutine, busy, onMark, onUnmark, onBackToToday }: Props) {
  const isToday = date === today
  // The rotation's suggestion only makes sense for today. A day before the
  // plan started wasn't part of it: only the day counts.
  const routines = plan && date >= plan.startedOn ? plan.routines : []
  const [choice, setChoice] = useState((isToday && nextRoutine?.id) || OTHER)

  const head = (
    <header className="tr-day-head">
      <span className="tr-kicker">{isToday ? 'Hoy' : longDay(date)}</span>
      {!isToday && (
        <button type="button" className="tr-link" onClick={onBackToToday}>
          Volver a hoy
        </button>
      )}
    </header>
  )

  if (session) {
    return (
      <Card className="tr-card tr-today tr-today--done">
        {head}
        <p className="tr-today-title">
          <CheckIcon width={20} height={20} className="tr-today-check" />
          {session.routineName ? `Entrenaste ${session.routineName}` : isToday ? 'Entrenaste hoy' : 'Entrenaste este día'}
        </p>
        <Button variant="ghost" className="tr-btn-sm" disabled={busy} onClick={() => onUnmark(date)}>
          Desmarcar
        </Button>
      </Card>
    )
  }

  return (
    <Card className="tr-card tr-today">
      {head}
      <p className="tr-today-title">
        {isToday ? (nextRoutine ? `Te toca ${nextRoutine.name}` : '¿Entrenaste hoy?') : '¿Entrenaste este día?'}
      </p>

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

      <Button disabled={busy} onClick={() => onMark(date, choice === OTHER ? null : choice)}>
        Marcar como entrenado
      </Button>
    </Card>
  )
}
