import { Link } from 'react-router-dom'
import { restLabel, shortDate, type PlanExercise, type TrainingPlan } from '../../training/plan'
import { DumbbellIcon } from '../icons'
import '../../styles/TrainingPlanCard.css'

function ExerciseRow({ exercise }: { exercise: PlanExercise }) {
  const { name, sets, reps, weightKg, restSeconds, notes } = exercise
  return (
    <li className="tp-exercise">
      <span className="tp-exercise-name">{name}</span>
      <span className="tp-exercise-dose">
        {sets}×{reps}
        {weightKg !== null && <> · {weightKg} kg</>}
        {restSeconds !== null && <> · <span title="Descanso">{restLabel(restSeconds)}</span></>}
      </span>
      {notes && <span className="tp-exercise-notes">{notes}</span>}
    </li>
  )
}

// The plan Elber just saved, so the user sees what was stored without asking.
export function TrainingPlanCard({ plan }: { plan: TrainingPlan }) {
  const { name, goal, notes, startedOn, durationWeeks, daysPerWeek, routines } = plan
  return (
    <section className="tp" aria-label={`Plan ${name}`}>
      <header className="tp-head">
        <DumbbellIcon width={16} height={16} className="tp-icon" />
        <span className="tp-kicker">Plan de entrenamiento</span>
      </header>
      <p className="tp-name">{name}</p>
      <p className="tp-meta">
        {durationWeeks === 1 ? '1 semana' : `${durationWeeks} semanas`} · {daysPerWeek === 1 ? '1 día' : `${daysPerWeek} días`} por semana · desde el {shortDate(startedOn)}
      </p>
      {goal && <p className="tp-goal">{goal}</p>}

      <ol className="tp-routines">
        {routines.map((routine) => (
          <li key={routine.id} className="tp-routine">
            <span className="tp-routine-name">{routine.name}</span>
            <ul className="tp-exercises">
              {routine.exercises.map((exercise, i) => <ExerciseRow key={i} exercise={exercise} />)}
            </ul>
          </li>
        ))}
      </ol>

      {notes && <p className="tp-notes">{notes}</p>}

      <footer className="tp-foot">
        <Link className="tp-link" to="/entrenamiento">Ver en Entrenamiento</Link>
      </footer>
    </section>
  )
}
