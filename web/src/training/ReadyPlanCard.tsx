import { useState } from 'react'
import { Button, Card } from '../components'
import type { PlanDraft } from './api'
import { PlanEditor } from './PlanEditor'
import { RoutineList } from './RoutineList'
import { shortDate, type ReadyPlan, type TrainingPlan } from './plan'

interface Props {
  plan: ReadyPlan
  // The plan under way, which starting this one closes.
  active: TrainingPlan | null
  busy: boolean
  onStart: (closeActive: boolean) => Promise<boolean>
  onSave: (draft: PlanDraft) => Promise<boolean>
  onDiscard: () => Promise<boolean>
}

// The plan Elber prepared. It waits here until the user starts it, the day
// they begin (Elber can't start it).
export function ReadyPlanCard({ plan, active, busy, onStart, onSave, onDiscard }: Props) {
  const [mode, setMode] = useState<'view' | 'edit' | 'start' | 'discard'>('view')

  if (mode === 'edit') {
    return (
      <Card className="tr-card tr-plan tr-ready">
        <span className="tr-kicker">Editar plan listo</span>
        <PlanEditor plan={plan} busy={busy} onSave={onSave} onCancel={() => setMode('view')} />
      </Card>
    )
  }

  return (
    <Card className="tr-card tr-plan tr-ready">
      <span className="tr-kicker">Plan listo para iniciar</span>
      <p className="tr-plan-name">{plan.name}</p>
      <p className="tr-muted">
        {plan.durationWeeks === 1 ? '1 semana' : `${plan.durationWeeks} semanas`} · {plan.daysPerWeek}{' '}
        {plan.daysPerWeek === 1 ? 'día' : 'días'} por semana · lo armó Elber el {shortDate(plan.preparedOn)}
      </p>
      {plan.goal && <p className="tr-plan-goal">{plan.goal}</p>}

      <RoutineList routines={plan.routines} />
      {plan.notes && <p className="tr-plan-notes">{plan.notes}</p>}

      <footer className="tr-plan-foot">
        {mode === 'start' && (
          <div className="tr-confirm" role="alertdialog" aria-label="Iniciar plan">
            <p>
              {active
                ? `Se cerrará «${active.name}» hoy y pasará a tu historial. «${plan.name}» empieza hoy.`
                : `«${plan.name}» empieza hoy.`}
            </p>
            <div className="tr-confirm-actions">
              <Button variant="ghost" className="tr-btn-sm" disabled={busy} onClick={() => setMode('view')}>
                Cancelar
              </Button>
              <Button className="tr-btn-sm" disabled={busy} onClick={() => onStart(active !== null)}>
                {active ? 'Sí, cerrar e iniciar' : 'Sí, iniciar hoy'}
              </Button>
            </div>
          </div>
        )}
        {mode === 'discard' && (
          <div className="tr-confirm" role="alertdialog" aria-label="Descartar plan">
            <p>Se borrará este plan. Si después lo quieres, pídele a Elber uno nuevo.</p>
            <div className="tr-confirm-actions">
              <Button variant="ghost" className="tr-btn-sm" disabled={busy} onClick={() => setMode('view')}>
                Cancelar
              </Button>
              <Button className="tr-btn-sm" disabled={busy} onClick={() => onDiscard()}>
                Sí, descartar
              </Button>
            </div>
          </div>
        )}
        {mode === 'view' && (
          <>
            <Button variant="ghost" className="tr-btn-sm" onClick={() => setMode('discard')}>
              Descartar
            </Button>
            <Button variant="ghost" className="tr-btn-sm" onClick={() => setMode('edit')}>
              Editar
            </Button>
            <Button className="tr-btn-sm" onClick={() => setMode('start')}>
              Iniciar plan
            </Button>
          </>
        )}
      </footer>
    </Card>
  )
}
