import { apiDeleteAuth, apiGetAuth, apiPostAuth, apiPutAuth } from '../lib/api'
import type { TrainingPlan } from './plan'

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
  lastMeasurement: { date: string; weightKg: number } | null
  measurementDue: boolean
}

const API = '/training'
const plan = (id: string) => `${API}/plans/${encodeURIComponent(id)}`

export const getSummary = (today: string) => apiGetAuth<TrainingSummary>(`${API}/summary?today=${today}`)

// Newest first: the active one, then the history.
export const listPlans = async () => (await apiGetAuth<{ plans: TrainingPlan[] }>(`${API}/plans`)).plans

export const closePlan = (id: string, closedOn: string) => apiPostAuth<TrainingPlan>(`${plan(id)}/close`, { closedOn })

// One per day: marking it again changes its routine. routineId null: only the day.
export const markSession = (date: string, routineId: string | null, today: string) =>
  apiPutAuth<TrainingSession>(`${API}/sessions/${date}`, { routineId, today })

export const unmarkSession = (date: string) => apiDeleteAuth(`${API}/sessions/${date}`)
