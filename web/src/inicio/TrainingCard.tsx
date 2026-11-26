import { Link } from 'react-router-dom'
import { Button, Card } from '../components'
import { TrainingIcon } from '../chat/icons'
import type { CardState, TrainingCardData } from './useInicio'

// Training: what today holds, plus the streak and this week's count.
function TrainingCard({ state }: { state: CardState<TrainingCardData> }) {
  if (state.status === 'unavailable') return null
  const data = state.status === 'ready' ? state.data : null

  return (
    <Card className="dash-card">
      <span className="dash-label dash-label--training">
        <TrainingIcon width={22} height={22} />
        Entrenamiento
      </span>
      {state.status === 'loading' && (
        <>
          <span className="dash-skeleton dash-skeleton--title" />
          <span className="dash-skeleton dash-skeleton--text" />
          <span className="dash-skeleton dash-skeleton--block" />
        </>
      )}
      {state.status === 'error' && <p className="dash-error">{state.message}</p>}
      {data && (
        <>
          <h2>{headline(data)}</h2>
          <p>{detail(data)}</p>
          <div className="dash-stats">
            <div className="dash-stat">
              <strong>
                {data.streakWeeks} {data.streakWeeks === 1 ? 'semana' : 'semanas'}
              </strong>
              <span>de racha</span>
            </div>
            <div className="dash-stat">
              <strong>
                {data.thisWeek.target > 0 ? `${data.thisWeek.done} de ${data.thisWeek.target}` : data.thisWeek.done}
              </strong>
              <span>{data.thisWeek.done === 1 && data.thisWeek.target === 0 ? 'día esta semana' : 'días esta semana'}</span>
            </div>
          </div>
          <Button as={Link} to="/entrenamiento" variant="ghost" className="dash-action">
            {data.planName ? 'Ver mi plan' : 'Ir a entrenamiento'}
          </Button>
        </>
      )}
    </Card>
  )
}

function headline(data: TrainingCardData) {
  if (data.trainedToday) return 'Hoy ya entrenaste'
  if (data.nextRoutine) return `Hoy toca: ${data.nextRoutine}`
  return 'Sin plan activo'
}

function detail(data: TrainingCardData) {
  if (data.trainedToday) return data.trainedToday.routineName ? `${data.trainedToday.routineName}. ¡Bien hecho!` : '¡Bien hecho!'
  if (data.planName) return `De tu plan ${data.planName}.`
  return 'Pídele a Elber en el chat que te prepare un plan.'
}

export default TrainingCard
