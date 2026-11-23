// Data of the 'training_plan' widget. Copy of CoachPlan in
// backEnd/src/modules/chat/skills/training/domain/training-coach.port.ts:
// change both together.
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

// "2026-11-20" → "20 nov". Read as UTC: the date is a day, not an instant.
export const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '')

// 150 → "2:30", 60 → "1 min", 45 → "45 s": how a rest is said in a gym.
export function restLabel(seconds: number) {
  if (seconds < 60) return `${seconds} s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return sec ? `${min}:${String(sec).padStart(2, '0')}` : `${min} min`
}
