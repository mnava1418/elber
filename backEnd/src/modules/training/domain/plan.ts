import { addDays } from './days.js'
import { InvalidTrainingDataError } from './errors.js'
import { checkNumber, checkOptionalNumber, checkOptionalText, checkText, MAX_NAME_LENGTH } from './validation.js'

export interface Exercise {
    // As the user knows it: "Sentadilla trasera". Charts follow an exercise
    // from plan to plan by this name (see exerciseKey).
    name: string
    sets: number
    // Free text, because it isn't always a number: "8-10", "12", "30 s", "al fallo".
    reps: string
    // Target weight; null for bodyweight exercises.
    weightKg: number | null
    restSeconds: number | null
    notes: string | null
}

// One day of the rotation (Día A, Día B...).
export interface Routine {
    // Stable while the plan is edited, so sessions keep pointing at it.
    id: string
    // "Día A: Pierna".
    name: string
    exercises: Exercise[]
}

export type PlanStatus = 'active' | 'closed'

// A training plan: routines done in rotation, in their array order (the
// ideal order the coach chose), for a number of weeks.
export interface Plan {
    id: string
    name: string
    goal: string | null
    notes: string | null
    status: PlanStatus
    startedOn: string
    durationWeeks: number
    // The weekly target of the streak while the plan is active.
    daysPerWeek: number
    routines: Routine[]
    // Set when the user closes it. Plans never close by themselves: the
    // duration is a guide.
    closedOn: string | null
}

// A plan Elber prepared, waiting for the user to start it in the page (they
// may build it on a Friday and start on Monday). Not a Plan yet: it has no
// dates, and the streak, the charts and the history don't see it. One at a
// time: preparing another replaces it.
export interface ReadyPlan {
    name: string
    goal: string | null
    notes: string | null
    durationWeeks: number
    daysPerWeek: number
    // Their ids carry over when it starts.
    routines: Routine[]
    // The day it was prepared.
    preparedOn: string
}

// A plan as Elber or the page writes it. A routine with the id of one the
// plan already has keeps it; any other gets a new one.
export interface RoutineDraft {
    id?: string
    name: string
    exercises: Exercise[]
}

export interface PlanDraft {
    name: string
    goal: string | null
    notes: string | null
    durationWeeks: number
    daysPerWeek: number
    routines: RoutineDraft[]
}

export const MAX_ROUTINES = 7
export const MAX_EXERCISES = 15

export const validatePlanDraft = (draft: PlanDraft): PlanDraft => {
    checkText('name', draft.name, MAX_NAME_LENGTH)
    checkOptionalText('goal', draft.goal)
    checkOptionalText('notes', draft.notes)
    checkNumber('durationWeeks', draft.durationWeeks, 1, 52, true)
    checkNumber('daysPerWeek', draft.daysPerWeek, 1, 7, true)
    if (draft.routines.length === 0 || draft.routines.length > MAX_ROUTINES) {
        throw new InvalidTrainingDataError(`a plan has between 1 and ${MAX_ROUTINES} routines`)
    }
    draft.routines.forEach((routine, i) => {
        const at = `routines[${i}]`
        checkText(`${at}.name`, routine.name, MAX_NAME_LENGTH)
        if (routine.exercises.length === 0 || routine.exercises.length > MAX_EXERCISES) {
            throw new InvalidTrainingDataError(`${at} has between 1 and ${MAX_EXERCISES} exercises`)
        }
        routine.exercises.forEach((exercise, j) => {
            const ex = `${at}.exercises[${j}]`
            checkText(`${ex}.name`, exercise.name, MAX_NAME_LENGTH)
            checkNumber(`${ex}.sets`, exercise.sets, 1, 20, true)
            checkText(`${ex}.reps`, exercise.reps, 30)
            checkOptionalNumber(`${ex}.weightKg`, exercise.weightKg, 0, 1000)
            checkOptionalNumber(`${ex}.restSeconds`, exercise.restSeconds, 0, 1800, true)
            checkOptionalText(`${ex}.notes`, exercise.notes)
        })
    })
    return draft
}

// Gives each routine of a draft its id: the one it already had in the plan,
// or a new one.
export const assignRoutineIds = (drafts: RoutineDraft[], existing: Routine[], newId: () => string): Routine[] => {
    const known = new Set(existing.map((routine) => routine.id))
    const used = new Set<string>()
    return drafts.map(({id, name, exercises}) => {
        // A repeated id would make two routines one: the second gets a new id.
        const keep = id !== undefined && known.has(id) && !used.has(id)
        const routineId = keep ? id : newId()
        used.add(routineId)
        return {id: routineId, name, exercises}
    })
}

// When the plan was meant to end. Informative only: it stays active until
// the user closes it.
export const plannedEndOf = (plan: Pick<Plan, 'startedOn' | 'durationWeeks'>): string =>
    addDays(plan.startedOn, plan.durationWeeks * 7 - 1)
