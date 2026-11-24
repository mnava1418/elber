import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../lib/api'
import {
  addMeasurement, closePlan, deleteMeasurement, getPage, markSession, unmarkSession, updatePlan, updateProfile,
  type MeasurementDraft, type PlanDraft, type TrainingPage, type TrainingProfile,
} from './api'
import { addDays, localToday, mondayOf } from './plan'

// The calendar shows this week and the three before it.
export const CALENDAR_WEEKS = 4

// What the user reads when something fails: the backend's codes they can act on.
function errorText(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'TOO_MANY_REQUESTS': return 'Demasiadas peticiones seguidas. Espera unos minutos y recarga la página.'
      case 'PLAN_CLOSED': return 'Ese plan ya estaba cerrado.'
      case 'ROUTINE_NOT_FOUND': return 'Esa rutina no estaba en tu plan ese día.'
      // The message names the field: "routines[0].exercises[1].sets must be...".
      case 'INVALID_TRAINING_DATA':
      case 'INVALID_BODY': return `Revisa los datos: ${error.message}`
    }
  }
  if (error instanceof TypeError) return 'No pudimos conectar con Elber. Revisa tu conexión.'
  // The cause stays in the console, for whoever debugs it.
  console.error(error)
  return error instanceof ApiError ? `Algo salió mal (${error.status} ${error.code}). Inténtalo de nuevo.` : 'Algo salió mal. Inténtalo de nuevo.'
}

// The training page's data and actions. After each change it reloads
// everything: the streak, the next routine, the history and the charts all
// depend on it, and the backend computes them.
export function useTraining() {
  // Fixed while the page is open; a reload picks up a new day.
  const [today] = useState(localToday)
  const calendarStart = addDays(mondayOf(today), -7 * (CALENDAR_WEEKS - 1))
  const [data, setData] = useState<TrainingPage | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setData(await getPage(today, calendarStart))
  }, [today, calendarStart])

  useEffect(() => {
    // Its state updates come after the await, not during the effect.
    // oxlint-disable-next-line react/set-state-in-effect
    load().catch((error) => setLoadError(errorText(error)))
  }, [load])

  // Elber may change the plan in the chat while this page stays open in
  // another tab: coming back to it shows the latest. At most once a minute,
  // so switching tabs back and forth doesn't spend the API's rate limit.
  useEffect(() => {
    let last = Date.now()
    const refresh = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 60_000) return
      last = Date.now()
      load().catch(() => {})
    }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [load])

  // Resolves to whether it worked, so a form knows whether to close.
  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true)
      setActionError(null)
      try {
        await action()
        await load()
        return true
      } catch (error) {
        setActionError(errorText(error))
        return false
      } finally {
        setBusy(false)
      }
    },
    [load],
  )

  return {
    today,
    calendarStart,
    data,
    loadError,
    actionError,
    busy,
    mark: (date: string, routineId: string | null) => run(() => markSession(date, routineId, today)),
    unmark: (date: string) => run(() => unmarkSession(date)),
    close: (planId: string) => run(() => closePlan(planId, today)),
    savePlan: (planId: string, draft: PlanDraft) => run(() => updatePlan(planId, draft)),
    saveProfile: (changes: Partial<TrainingProfile>) => run(() => updateProfile(changes)),
    addMeasurement: (draft: MeasurementDraft) => run(() => addMeasurement(draft)),
    deleteMeasurement: (id: string) => run(() => deleteMeasurement(id)),
  }
}
