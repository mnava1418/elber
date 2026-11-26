import { Link } from 'react-router-dom'
import { Button, Card } from '../components'
import { DiaryIcon } from '../chat/icons'
import { DIARY } from '../chat/section'
import { weekdayInitial, weekdayName } from './format'
import type { CardState, DiaryCardData } from './useInicio'

// The diary: whether we talked today, and the last week at a glance.
function DiaryCard({ state }: { state: CardState<DiaryCardData> }) {
  // Not this user's section: no card at all.
  if (state.status === 'unavailable') return null
  const data = state.status === 'ready' ? state.data : null
  const talkedDays = data?.week.filter((d) => d.talked).length ?? 0

  return (
    <Card className="dash-card">
      <span className="dash-label dash-label--diary">
        <DiaryIcon width={22} height={22} />
        Diario
      </span>
      {state.status === 'loading' && <Loading />}
      {state.status === 'error' && <p className="dash-error">{state.message}</p>}
      {data && (
        <>
          <h2>{data.talkedToday ? 'Ya platicamos hoy' : 'Aún no platicamos hoy'}</h2>
          <p>
            {data.talkedToday
              ? '¿Se te olvidó algo? Sigue donde nos quedamos.'
              : '¿Cómo te fue? Platícamelo y lo guardo como la entrada de hoy.'}
          </p>
          <ol className="dash-week" aria-label={`Últimos 7 días: ${talkedDays} con conversación`}>
            {data.week.map((d) => (
              <li key={d.date} className={d.talked ? 'is-done' : undefined}>
                <span className="dash-week-bar" />
                <span className="dash-week-day" aria-hidden="true">{weekdayInitial(d.date)}</span>
                <span className="dash-sr">
                  {weekdayName(d.date)}: {d.talked ? 'con conversación' : 'sin conversación'}
                </span>
              </li>
            ))}
          </ol>
          <Button as={Link} to={DIARY.path} variant={data.talkedToday ? 'ghost' : 'primary'} className="dash-action">
            {data.talkedToday ? 'Seguir platicando' : 'Platicar de hoy'}
          </Button>
        </>
      )}
    </Card>
  )
}

function Loading() {
  return (
    <>
      <span className="dash-skeleton dash-skeleton--title" />
      <span className="dash-skeleton dash-skeleton--text" />
      <span className="dash-skeleton dash-skeleton--block" />
    </>
  )
}

export default DiaryCard
