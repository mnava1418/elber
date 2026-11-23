import { Link } from 'react-router-dom'
import { Logo } from '../components'
import { ActivePlan } from '../training/ActivePlan'
import { PlanHistory } from '../training/PlanHistory'
import { StreakCard } from '../training/StreakCard'
import { TodayCard } from '../training/TodayCard'
import { useTraining } from '../training/useTraining'
import '../styles/Inicio.css'
import '../styles/Training.css'

// The training page: today's routine, the streak and the plans. It shares the
// dashboard's shell (.inicio): same dark theme, nav and width.
function Training() {
  const { today, data, loadError, actionError, busy, mark, unmark, close } = useTraining()
  const active = data?.plans.find((plan) => plan.status === 'active') ?? null
  const closed = data?.plans.filter((plan) => plan.status === 'closed') ?? []

  return (
    <div className="inicio training">
      <header className="inicio-nav">
        <Link to="/inicio" className="tr-back" aria-label="Volver al inicio">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="inicio-main tr-main">
        <h1>Entrenamiento</h1>

        {loadError && <p className="tr-error" role="alert">{loadError}</p>}
        {!data && !loadError && <p className="tr-muted" role="status">Cargando…</p>}
        {actionError && <p className="tr-error" role="alert">{actionError}</p>}

        {data && (
          <div className="tr-grid">
            {/* Keyed by the session: after marking or unmarking it starts over
                with the new suggestion. */}
            <TodayCard
              key={data.summary.todaySession?.date ?? data.summary.nextRoutine?.id ?? 'none'}
              summary={data.summary}
              plan={active}
              busy={busy}
              onMark={mark}
              onUnmark={unmark}
            />
            <StreakCard streak={data.summary.streak} />
            <div className="tr-wide">
              <ActivePlan key={active?.id} plan={active} today={today} nextRoutineId={data.summary.nextRoutine?.id ?? null} busy={busy} onClose={close} />
            </div>
            <div className="tr-wide">
              <PlanHistory plans={closed} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Training
