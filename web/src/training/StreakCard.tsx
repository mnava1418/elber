import { Card } from '../components'
import type { TrainingSummary } from './api'

// Weeks in a row meeting the target, and how this week is going. This week
// doesn't break the streak while it can still be met.
export function StreakCard({ streak }: { streak: TrainingSummary['streak'] }) {
  const { weeks, currentWeek, totalDays } = streak
  const met = currentWeek.done >= currentWeek.target
  return (
    <Card className="tr-card tr-streak">
      <span className="tr-kicker">Racha</span>
      <p className="tr-streak-weeks">
        <span className="tr-big">{weeks}</span> {weeks === 1 ? 'semana' : 'semanas'}
      </p>
      <div className="tr-week" aria-label={`Esta semana: ${currentWeek.done} de ${currentWeek.target} días`}>
        <span className="tr-week-label">
          Esta semana: {currentWeek.done} de {currentWeek.target} {currentWeek.target === 1 ? 'día' : 'días'}
          {met && ' ✓'}
        </span>
        <span className="tr-dots" aria-hidden="true">
          {Array.from({ length: Math.max(currentWeek.target, currentWeek.done) }, (_, i) => (
            <span key={i} className={`tr-dot${i < currentWeek.done ? ' tr-dot--on' : ''}`} />
          ))}
        </span>
      </div>
      <span className="tr-muted">{totalDays === 1 ? '1 día entrenado en total' : `${totalDays} días entrenados en total`}</span>
    </Card>
  )
}
