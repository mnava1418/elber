import { apiGetAuth } from '../lib/api'

// Contract of the backend's training API (/training). Copy of
// web/src/training/api.ts (itself a copy of backEnd/src/modules/training):
// change them together. Only what Inicio needs so far; the training page
// brings the rest (phase 10).
const API = '/training'

export interface TrainingSession {
  date: string
  planId: string | null
  routineId: string | null
  routineName: string | null
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

// Only the summary: what Inicio's training card shows.
export const getSummary = (today: string) => apiGetAuth<TrainingSummary>(`${API}/summary?today=${today}`)
