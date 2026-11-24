import { Card } from '../components'
import type { TrainingSession, TrainingSummary } from './api'
import { CALENDAR_WEEKS } from './useTraining'
import { addDays, longDay } from './plan'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface Props {
  streak: TrainingSummary['streak']
  sessions: TrainingSession[]
  calendarStart: string
  today: string
  selected: string
  onSelect: (date: string) => void
}

// Weeks in a row meeting the target, how this week is going, and the last
// four weeks: a day there opens it to mark it (forgot to mark yesterday?).
// This week doesn't break the streak while it can still be met.
export function StreakCard({ streak, sessions, calendarStart, today, selected, onSelect }: Props) {
  const { weeks, currentWeek, totalDays } = streak
  const met = currentWeek.done >= currentWeek.target
  const trained = new Map(sessions.map((s) => [s.date, s]))
  const days = Array.from({ length: CALENDAR_WEEKS * 7 }, (_, i) => addDays(calendarStart, i))

  return (
    <Card className="tr-card tr-streak">
      <span className="tr-kicker">Racha</span>
      <p className="tr-streak-weeks">
        <span className="tr-big">{weeks}</span> {weeks === 1 ? 'semana' : 'semanas'}
      </p>
      <span className="tr-week-label">
        Esta semana: {currentWeek.done} de {currentWeek.target} {currentWeek.target === 1 ? 'día' : 'días'}
        {met && ' ✓'}
      </span>

      <div className="tr-calendar" role="group" aria-label={`Últimas ${CALENDAR_WEEKS} semanas`}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="tr-cal-weekday" aria-hidden="true">{d}</span>
        ))}
        {days.map((date) => {
          const session = trained.get(date)
          const future = date > today
          const classes = ['tr-cal-day', session && 'tr-cal-day--on', date === today && 'tr-cal-day--today', date === selected && 'tr-cal-day--selected']
          return (
            <button
              key={date}
              type="button"
              className={classes.filter(Boolean).join(' ')}
              disabled={future}
              aria-pressed={date === selected}
              aria-label={`${longDay(date)}${session ? `: ${session.routineName ?? 'entrenaste'}` : ''}`}
              title={session?.routineName ?? undefined}
              onClick={() => onSelect(date)}
            >
              {Number(date.slice(8))}
            </button>
          )
        })}
      </div>
      <span className="tr-muted">{totalDays === 1 ? '1 día entrenado en total' : `${totalDays} días entrenados en total`}</span>
    </Card>
  )
}
