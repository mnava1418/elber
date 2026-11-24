import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components'
import { ActivePlan } from '../training/ActivePlan'
import { DayCard } from '../training/DayCard'
import { MeasurementsCard } from '../training/MeasurementsCard'
import { PlanHistory } from '../training/PlanHistory'
import { ProfileCard } from '../training/ProfileCard'
import { ProgressCard } from '../training/ProgressCard'
import { StreakCard } from '../training/StreakCard'
import { useTraining } from '../training/useTraining'
import '../styles/Inicio.css'
import '../styles/Training.css'

// The training page: the day, the streak, the plans, the progress, the
// measurements and the profile. It shares the dashboard's shell (.inicio):
// same dark theme, nav and width.
function Training() {
  const t = useTraining()
  const { today, data } = t
  // The day the day card shows; the calendar picks another.
  const [selected, setSelected] = useState(today)
  const active = data?.plans.find((plan) => plan.status === 'active') ?? null
  const closed = data?.plans.filter((plan) => plan.status === 'closed') ?? []
  const session = data?.sessions.find((s) => s.date === selected) ?? null

  return (
    <div className="inicio training">
      <header className="inicio-nav">
        <Link to="/inicio" className="tr-back" aria-label="Volver al inicio">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="inicio-main tr-main">
        <h1>Entrenamiento</h1>

        {t.loadError && <p className="tr-error" role="alert">{t.loadError}</p>}
        {!data && !t.loadError && <p className="tr-muted" role="status">Cargando…</p>}
        {/* Fixed at the bottom: the form that failed may be far down the page. */}
        {t.actionError && <p className="tr-error tr-error--toast" role="alert">{t.actionError}</p>}

        {data && (
          <div className="tr-grid">
            {/* Keyed by the day and its session: after marking or unmarking it
                starts over with the new suggestion. */}
            <DayCard
              key={`${selected}-${session?.routineId ?? session?.date ?? 'none'}-${data.summary.nextRoutine?.id ?? ''}`}
              date={selected}
              today={today}
              session={session}
              plan={active}
              nextRoutine={data.summary.nextRoutine}
              busy={t.busy}
              onMark={t.mark}
              onUnmark={t.unmark}
              onBackToToday={() => setSelected(today)}
            />
            <StreakCard
              streak={data.summary.streak}
              sessions={data.sessions}
              calendarStart={t.calendarStart}
              today={today}
              selected={selected}
              onSelect={setSelected}
            />
            <div className="tr-wide">
              <ActivePlan
                key={active?.id}
                plan={active}
                today={today}
                nextRoutineId={data.summary.nextRoutine?.id ?? null}
                busy={t.busy}
                onClose={t.close}
                onSave={t.savePlan}
              />
            </div>
            <div className="tr-wide">
              <ProgressCard progress={data.progress} />
            </div>
            <div className="tr-wide">
              <MeasurementsCard
                measurements={data.progress.measurements}
                due={data.summary.measurementDue}
                today={today}
                busy={t.busy}
                onAdd={t.addMeasurement}
                onDelete={t.deleteMeasurement}
              />
            </div>
            <div className="tr-wide">
              <ProfileCard profile={data.profile} busy={t.busy} onSave={t.saveProfile} />
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
