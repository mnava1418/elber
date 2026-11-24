import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../components'
import type { PlanDraft } from './api'
import { PlanEditor } from './PlanEditor'
import { RoutineList } from './RoutineList'
import { daysBetween, plannedEndOf, shortDate, type TrainingPlan } from './plan'

interface Props {
  plan: TrainingPlan | null
  today: string
  nextRoutineId: string | null
  busy: boolean
  onClose: (planId: string) => void
  onSave: (planId: string, draft: PlanDraft) => Promise<boolean>
}

// The active plan, and the only place where it is closed (Elber can't).
export function ActivePlan({ plan, today, nextRoutineId, busy, onClose, onSave }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)

  if (!plan) {
    return (
      <Card className="tr-card tr-empty">
        <span className="tr-kicker">Plan</span>
        <p className="tr-empty-title">No tienes un plan activo</p>
        <p className="tr-muted">Platícale a Elber tus objetivos y te arma uno.</p>
        <Button as={Link} to="/chat" variant="ghost" className="tr-btn-sm">
          Ir al chat
        </Button>
      </Card>
    )
  }

  if (editing) {
    return (
      <Card className="tr-card tr-plan">
        <span className="tr-kicker">Editar plan</span>
        <PlanEditor plan={plan} busy={busy} onSave={(draft) => onSave(plan.id, draft)} onCancel={() => setEditing(false)} />
      </Card>
    )
  }

  // The week it is in; past its duration it keeps counting until it is closed.
  const week = Math.floor(daysBetween(plan.startedOn, today) / 7) + 1
  return (
    <Card className="tr-card tr-plan">
      <span className="tr-kicker">Plan activo</span>
      <p className="tr-plan-name">{plan.name}</p>
      <p className="tr-muted">
        Semana {Math.max(week, 1)} de {plan.durationWeeks} · {plan.daysPerWeek} {plan.daysPerWeek === 1 ? 'día' : 'días'} por semana ·{' '}
        {shortDate(plan.startedOn)} – {shortDate(plannedEndOf(plan))}
      </p>
      {week > plan.durationWeeks && <p className="tr-note">Ya pasaron las {plan.durationWeeks} semanas del plan. Ciérralo cuando quieras empezar otro.</p>}
      {plan.goal && <p className="tr-plan-goal">{plan.goal}</p>}

      <RoutineList routines={plan.routines} highlight={nextRoutineId} />
      {plan.notes && <p className="tr-plan-notes">{plan.notes}</p>}

      <footer className="tr-plan-foot">
        {confirming ? (
          <div className="tr-confirm" role="alertdialog" aria-label="Cerrar plan">
            <p>Se cerrará hoy y pasará a tu historial. Después puedes pedirle a Elber uno nuevo.</p>
            <div className="tr-confirm-actions">
              <Button variant="ghost" className="tr-btn-sm" disabled={busy} onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
              <Button className="tr-btn-sm" disabled={busy} onClick={() => onClose(plan.id)}>
                Sí, cerrar plan
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button variant="ghost" className="tr-btn-sm" onClick={() => setEditing(true)}>
              Editar plan
            </Button>
            <Button variant="ghost" className="tr-btn-sm" onClick={() => setConfirming(true)}>
              Cerrar plan
            </Button>
          </>
        )}
      </footer>
    </Card>
  )
}
