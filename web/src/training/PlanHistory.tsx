import { Card } from '../components'
import { ChevronIcon } from '../chat/icons'
import { RoutineList } from './RoutineList'
import { shortDate, type TrainingPlan } from './plan'

// Closed plans, newest first. Each one opens to show what it had.
export function PlanHistory({ plans }: { plans: TrainingPlan[] }) {
  if (plans.length === 0) return null
  return (
    <Card className="tr-card tr-history">
      <span className="tr-kicker">Historial</span>
      <ul className="tr-history-list">
        {plans.map((plan) => (
          <li key={plan.id}>
            <details className="tr-past">
              <summary>
                <span className="tr-past-name">{plan.name}</span>
                <span className="tr-muted">
                  {shortDate(plan.startedOn, true)} – {plan.closedOn ? shortDate(plan.closedOn, true) : ''}
                </span>
                <ChevronIcon className="tr-past-chevron" />
              </summary>
              {plan.goal && <p className="tr-plan-goal">{plan.goal}</p>}
              <RoutineList routines={plan.routines} />
            </details>
          </li>
        ))}
      </ul>
    </Card>
  )
}
