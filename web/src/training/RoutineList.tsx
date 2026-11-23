import { restLabel, type PlanRoutine } from './plan'

// A plan's routines with their exercises, as the gym reads them: 4×6 · 60 kg · 2:30.
export function RoutineList({ routines, highlight }: { routines: PlanRoutine[]; highlight?: string | null }) {
  return (
    <ol className="tr-routines">
      {routines.map((routine) => (
        <li key={routine.id} className={`tr-routine${routine.id === highlight ? ' tr-routine--next' : ''}`}>
          <span className="tr-routine-name">
            {routine.name}
            {routine.id === highlight && <span className="tr-badge">Sigue</span>}
          </span>
          <ul className="tr-exercises">
            {routine.exercises.map(({ name, sets, reps, weightKg, restSeconds, notes }, i) => (
              <li key={i} className="tr-exercise">
                <span className="tr-exercise-name">{name}</span>
                <span className="tr-exercise-dose">
                  {sets}×{reps}
                  {weightKg !== null && <> · {weightKg} kg</>}
                  {restSeconds !== null && <> · <span title="Descanso">{restLabel(restSeconds)}</span></>}
                </span>
                {notes && <span className="tr-exercise-notes">{notes}</span>}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
