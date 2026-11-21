import type { Plan, Routine } from './plan.js'

// A day the user trained. One per day: the date is its id.
export interface TrainingSession {
    date: string
    // The plan active that day; null if there was none.
    planId: string | null
    // The routine they did; null if they only marked the day.
    routineId: string | null
    // Copied when it is marked, so history still reads well if the routine
    // is renamed or removed later.
    routineName: string | null
}

// The routine that comes next in the rotation: the one after the last one
// done in this plan, or the first one. The user may do another; this is the
// suggestion.
export const nextRoutine = (plan: Pick<Plan, 'id' | 'routines'>, sessions: TrainingSession[]): Routine | null => {
    if (plan.routines.length === 0) return null
    const last = sessions
        .filter((session) => session.planId === plan.id && session.routineId !== null)
        .reduce<TrainingSession | null>((latest, session) => (latest === null || session.date > latest.date ? session : latest), null)
    const index = last === null ? -1 : plan.routines.findIndex((routine) => routine.id === last.routineId)
    // A removed routine restarts the rotation.
    return plan.routines[index === -1 ? 0 : (index + 1) % plan.routines.length] ?? null
}
