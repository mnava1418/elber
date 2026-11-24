import { useState } from 'react'
import { Button } from '../components'
import { ChevronIcon, PlusIcon, TrashIcon } from '../chat/icons'
import type { PlanDraft } from './api'
import { numberText, toNumber, toText } from './form'
import type { TrainingPlan } from './plan'

interface ExerciseForm {
  name: string
  sets: string
  reps: string
  weightKg: string
  restSeconds: string
  notes: string
}

interface RoutineForm {
  // Routines that were already in the plan keep their id; sessions point at it.
  id?: string
  // React key: stable while routines move.
  key: string
  name: string
  exercises: ExerciseForm[]
}

const emptyExercise = (): ExerciseForm => ({ name: '', sets: '3', reps: '10', weightKg: '', restSeconds: '', notes: '' })

let nextKey = 0
const newKey = () => `new-${nextKey++}`

const toForm = (plan: TrainingPlan) => ({
  name: plan.name,
  goal: plan.goal ?? '',
  notes: plan.notes ?? '',
  durationWeeks: String(plan.durationWeeks),
  daysPerWeek: String(plan.daysPerWeek),
  routines: plan.routines.map((r): RoutineForm => ({
    id: r.id,
    key: r.id,
    name: r.name,
    exercises: r.exercises.map((e) => ({
      name: e.name, sets: String(e.sets), reps: e.reps, weightKg: numberText(e.weightKg), restSeconds: numberText(e.restSeconds), notes: e.notes ?? '',
    })),
  })),
})

type Form = ReturnType<typeof toForm>

// Empty numbers go as 0: the backend rejects them, naming the field.
const toDraft = (form: Form): PlanDraft => ({
  name: form.name.trim(),
  goal: toText(form.goal),
  notes: toText(form.notes),
  durationWeeks: toNumber(form.durationWeeks) ?? 0,
  daysPerWeek: toNumber(form.daysPerWeek) ?? 0,
  routines: form.routines.map(({ id, name, exercises }) => ({
    ...(id ? { id } : {}),
    name: name.trim(),
    exercises: exercises.map((e) => ({
      name: e.name.trim(), sets: toNumber(e.sets) ?? 0, reps: e.reps.trim(),
      weightKg: toNumber(e.weightKg), restSeconds: toNumber(e.restSeconds), notes: toText(e.notes),
    })),
  })),
})

// The backend's limits (MAX_ROUTINES, MAX_EXERCISES).
const MAX_ROUTINES = 7
const MAX_EXERCISES = 15

interface Props {
  plan: TrainingPlan
  busy: boolean
  onSave: (draft: PlanDraft) => Promise<boolean>
  onCancel: () => void
}

// Edits the active plan by hand: the same plan Elber edits in the chat.
export function PlanEditor({ plan, busy, onSave, onCancel }: Props) {
  const [form, setForm] = useState(() => toForm(plan))
  const set = (changes: Partial<Form>) => setForm((f) => ({ ...f, ...changes }))
  const setRoutine = (i: number, changes: Partial<RoutineForm>) =>
    set({ routines: form.routines.map((r, j) => (j === i ? { ...r, ...changes } : r)) })
  const setExercise = (ri: number, ei: number, changes: Partial<ExerciseForm>) =>
    setRoutine(ri, { exercises: form.routines[ri]!.exercises.map((e, j) => (j === ei ? { ...e, ...changes } : e)) })
  // The order of the routines is the rotation's.
  const move = (i: number, by: -1 | 1) => {
    const routines = [...form.routines]
    ;[routines[i], routines[i + by]] = [routines[i + by]!, routines[i]!]
    set({ routines })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (await onSave(toDraft(form))) onCancel()
  }

  return (
    <form className="tr-editor" onSubmit={submit}>
      <div className="tr-form-grid">
        <label className="tr-field tr-field--wide">
          <span>Nombre</span>
          <input required maxLength={80} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="tr-field">
          <span>Semanas</span>
          <input required inputMode="numeric" value={form.durationWeeks} onChange={(e) => set({ durationWeeks: e.target.value })} />
        </label>
        <label className="tr-field">
          <span>Días por semana</span>
          <input required inputMode="numeric" value={form.daysPerWeek} onChange={(e) => set({ daysPerWeek: e.target.value })} />
        </label>
        <label className="tr-field tr-field--wide">
          <span>Objetivo</span>
          <input maxLength={500} value={form.goal} onChange={(e) => set({ goal: e.target.value })} />
        </label>
        <label className="tr-field tr-field--wide">
          <span>Notas (progresión, calentamiento…)</span>
          <textarea rows={3} maxLength={500} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </label>
      </div>

      <ol className="tr-edit-routines">
        {form.routines.map((routine, ri) => (
          <li key={routine.key} className="tr-edit-routine">
            <div className="tr-edit-routine-head">
              <label className="tr-field tr-field--grow">
                <span>Rutina {ri + 1}</span>
                <input required maxLength={80} value={routine.name} onChange={(e) => setRoutine(ri, { name: e.target.value })} />
              </label>
              <div className="tr-icon-actions">
                <button type="button" className="tr-icon-btn" aria-label="Subir rutina" disabled={ri === 0} onClick={() => move(ri, -1)}>
                  <ChevronIcon style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button type="button" className="tr-icon-btn" aria-label="Bajar rutina" disabled={ri === form.routines.length - 1} onClick={() => move(ri, 1)}>
                  <ChevronIcon />
                </button>
                <button
                  type="button"
                  className="tr-icon-btn"
                  aria-label="Quitar rutina"
                  disabled={form.routines.length === 1}
                  onClick={() => set({ routines: form.routines.filter((_, j) => j !== ri) })}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            <ul className="tr-edit-exercises">
              {routine.exercises.map((exercise, ei) => (
                <li key={ei} className="tr-edit-exercise">
                  <label className="tr-field tr-field--name">
                    <span>Ejercicio</span>
                    <input required maxLength={80} value={exercise.name} onChange={(e) => setExercise(ri, ei, { name: e.target.value })} />
                  </label>
                  <label className="tr-field">
                    <span>Series</span>
                    <input required inputMode="numeric" value={exercise.sets} onChange={(e) => setExercise(ri, ei, { sets: e.target.value })} />
                  </label>
                  <label className="tr-field">
                    <span>Reps</span>
                    <input required maxLength={30} value={exercise.reps} onChange={(e) => setExercise(ri, ei, { reps: e.target.value })} />
                  </label>
                  <label className="tr-field">
                    <span>Peso (kg)</span>
                    <input inputMode="decimal" value={exercise.weightKg} onChange={(e) => setExercise(ri, ei, { weightKg: e.target.value })} />
                  </label>
                  <label className="tr-field">
                    <span>Descanso (s)</span>
                    <input inputMode="numeric" value={exercise.restSeconds} onChange={(e) => setExercise(ri, ei, { restSeconds: e.target.value })} />
                  </label>
                  <label className="tr-field tr-field--notes">
                    <span>Notas</span>
                    <input maxLength={500} value={exercise.notes} onChange={(e) => setExercise(ri, ei, { notes: e.target.value })} />
                  </label>
                  <button
                    type="button"
                    className="tr-icon-btn tr-edit-remove"
                    aria-label={`Quitar ${exercise.name || 'ejercicio'}`}
                    disabled={routine.exercises.length === 1}
                    onClick={() => setRoutine(ri, { exercises: routine.exercises.filter((_, j) => j !== ei) })}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
            {routine.exercises.length < MAX_EXERCISES && (
              <button type="button" className="tr-link tr-add" onClick={() => setRoutine(ri, { exercises: [...routine.exercises, emptyExercise()] })}>
                <PlusIcon width={14} height={14} /> Agregar ejercicio
              </button>
            )}
          </li>
        ))}
      </ol>
      {form.routines.length < MAX_ROUTINES && (
        <button
          type="button"
          className="tr-link tr-add"
          onClick={() => set({ routines: [...form.routines, { key: newKey(), name: `Día ${String.fromCharCode(65 + form.routines.length)}`, exercises: [emptyExercise()] }] })}
        >
          <PlusIcon width={14} height={14} /> Agregar rutina
        </button>
      )}

      <footer className="tr-form-actions">
        <Button type="button" variant="ghost" className="tr-btn-sm" disabled={busy} onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="tr-btn-sm" disabled={busy}>
          Guardar plan
        </Button>
      </footer>
    </form>
  )
}
