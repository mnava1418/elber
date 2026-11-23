import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../lib/api'
import { closePlan, getSummary, listPlans, markSession, unmarkSession, type TrainingSummary } from './api'
import { localToday, type TrainingPlan } from './plan'

interface TrainingData {
  summary: TrainingSummary
  plans: TrainingPlan[]
}

// What the user reads when something fails: the backend's codes they can act on.
function errorText(error: unknown) {
  if (error instanceof ApiError && error.code === 'PLAN_CLOSED') return 'Ese plan ya estaba cerrado.'
  if (error instanceof ApiError && error.code === 'ROUTINE_NOT_FOUND') return 'Esa rutina ya no está en tu plan. Recarga la página.'
  if (error instanceof TypeError) return 'No pudimos conectar con Elber. Revisa tu conexión.'
  return 'Algo salió mal. Inténtalo de nuevo.'
}

// The training page's data and actions. After each change it reloads
// everything: the streak, the next routine and the history all depend on it,
// and the backend computes them.
export function useTraining() {
  // Fixed while the page is open; a reload picks up a new day.
  const [today] = useState(localToday)
  const [data, setData] = useState<TrainingData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [summary, plans] = await Promise.all([getSummary(today), listPlans()])
    setData({ summary, plans })
  }, [today])

  useEffect(() => {
    // Its state updates come after the await, not during the effect.
    // oxlint-disable-next-line react/set-state-in-effect
    load().catch((error) => setLoadError(errorText(error)))
  }, [load])

  // Elber may change the plan in the chat while this page stays open in
  // another tab: coming back to it shows the latest.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') load().catch(() => {})
    }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [load])

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true)
      setActionError(null)
      try {
        await action()
        await load()
      } catch (error) {
        setActionError(errorText(error))
      } finally {
        setBusy(false)
      }
    },
    [load],
  )

  return {
    today,
    data,
    loadError,
    actionError,
    busy,
    mark: (routineId: string | null) => run(() => markSession(today, routineId, today)),
    unmark: () => run(() => unmarkSession(today)),
    close: (planId: string) => run(() => closePlan(planId, today)),
  }
}
