// A training plan, as the training API and the chat's 'training_plan' widget
// send it. Copy of Plan in backEnd/src/modules/training/domain/plan.ts (and
// CoachPlan in the chat's training skill): change them together.
export interface PlanExercise {
  name: string
  sets: number
  reps: string
  weightKg: number | null
  restSeconds: number | null
  notes: string | null
}

export interface PlanRoutine {
  id: string
  name: string
  exercises: PlanExercise[]
}

export interface TrainingPlan {
  id: string
  name: string
  goal: string | null
  notes: string | null
  status: 'active' | 'closed'
  startedOn: string
  durationWeeks: number
  daysPerWeek: number
  routines: PlanRoutine[]
  closedOn: string | null
}

// "2026-11-20" → "20 nov" ("20 nov 2026" withYear). Read as UTC: the date is
// a day, not an instant.
export const shortDate = (date: string, withYear = false) =>
  new Date(`${date}T00:00:00Z`)
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined, timeZone: 'UTC' })
    .replaceAll('.', '')

// 150 → "2:30", 60 → "1 min", 45 → "45 s": how a rest is said in a gym.
export function restLabel(seconds: number) {
  if (seconds < 60) return `${seconds} s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return sec ? `${min}:${String(sec).padStart(2, '0')}` : `${min} min`
}

// Last day of the plan as planned (it may be closed before or after).
export const plannedEndOf = (plan: Pick<TrainingPlan, 'startedOn' | 'durationWeeks'>) => addDays(plan.startedOn, plan.durationWeeks * 7 - 1)

// Days are "YYYY-MM-DD" and their math is done in UTC, like the backend, so
// the user's time zone never shifts them.
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)

// The user's today, on their device: the backend never decides it.
export function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
