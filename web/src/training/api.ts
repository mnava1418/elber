import { apiDeleteAuth, apiGetAuth, apiPatchAuth, apiPostAuth, apiPutAuth } from '../lib/api'
import type { PlanRoutine, TrainingPlan } from './plan'

// Contract of the backend's training API (/training). Copy of the types in
// backEnd/src/modules/training: change both together.
export interface TrainingSession {
  date: string
  planId: string | null
  routineId: string | null
  routineName: string | null
}

export interface TrainingSummary {
  today: string
  todaySession: TrainingSession | null
  streak: {
    // Weeks in a row meeting their target. This week only counts once it is met.
    weeks: number
    currentWeek: { weekStart: string; done: number; target: number }
    totalDays: number
  }
  activePlan: { id: string; name: string; startedOn: string; plannedEndOn: string } | null
  nextRoutine: { id: string; name: string } | null
  lastMeasurement: BodyMeasurement | null
  measurementDue: boolean
}

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export const PLACES = ['gym', 'home', 'mixed'] as const

// Every field is null until known.
export interface TrainingProfile {
  goal: string | null
  level: (typeof LEVELS)[number] | null
  daysPerWeek: number | null
  minutesPerSession: number | null
  place: (typeof PLACES)[number] | null
  equipment: string | null
  injuries: string | null
  preferences: string | null
  heightCm: number | null
}

export interface BodyMeasurement {
  id: string
  date: string
  weightKg: number
  bodyFatPct: number | null
  waistCm: number | null
  hipCm: number | null
  chestCm: number | null
  armCm: number | null
  thighCm: number | null
}

export type MeasurementDraft = Omit<BodyMeasurement, 'id'>

// What the page sends to change a plan: routines that stay keep their id.
export type PlanDraft = Pick<TrainingPlan, 'name' | 'goal' | 'notes' | 'durationWeeks' | 'daysPerWeek'> & {
  routines: (Omit<PlanRoutine, 'id'> & { id?: string })[]
}

// An exercise's target in each plan it was in, oldest plan first.
export interface ExerciseSeries {
  key: string
  name: string
  points: { planId: string; planName: string; startedOn: string; sets: number; reps: string; weightKg: number | null }[]
}

export interface TrainingProgress {
  exercises: ExerciseSeries[]
  // Oldest first.
  measurements: BodyMeasurement[]
}

const API = '/training'
const plan = (id: string) => `${API}/plans/${encodeURIComponent(id)}`

// Everything the page shows, in one request (the API is rate limited per IP).
export interface TrainingPage {
  summary: TrainingSummary
  // Newest first: the active one, then the history.
  plans: TrainingPlan[]
  // From the calendar's first day to today, oldest first.
  sessions: TrainingSession[]
  profile: TrainingProfile
  progress: TrainingProgress
}

export const getPage = (today: string, from: string) => apiGetAuth<TrainingPage>(`${API}/page?today=${today}&from=${from}`)

export const updatePlan = (id: string, draft: PlanDraft) => apiPutAuth<TrainingPlan>(plan(id), draft)

export const closePlan = (id: string, closedOn: string) => apiPostAuth<TrainingPlan>(`${plan(id)}/close`, { closedOn })

// One per day: marking it again changes its routine. routineId null: only the day.
export const markSession = (date: string, routineId: string | null, today: string) =>
  apiPutAuth<TrainingSession>(`${API}/sessions/${date}`, { routineId, today })

export const unmarkSession = (date: string) => apiDeleteAuth(`${API}/sessions/${date}`)

// Only the fields sent change; null clears one.
export const updateProfile = (changes: Partial<TrainingProfile>) => apiPatchAuth<TrainingProfile>(`${API}/profile`, changes)

export const addMeasurement = (draft: MeasurementDraft) => apiPostAuth<BodyMeasurement>(`${API}/measurements`, draft)

export const deleteMeasurement = (id: string) => apiDeleteAuth(`${API}/measurements/${encodeURIComponent(id)}`)
