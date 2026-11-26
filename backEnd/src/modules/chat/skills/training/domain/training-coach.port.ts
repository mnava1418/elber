// Port: what the coach skill needs from the training data. The training
// module owns that data and implements this (app.ts plugs it in): the chat
// never imports it, so these shapes are declared here again on purpose, and
// TypeScript checks at app.ts that both sides still fit.

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export const PLACES = ['gym', 'home', 'mixed'] as const

export interface CoachProfile {
    goal: string | null
    level: typeof LEVELS[number] | null
    daysPerWeek: number | null
    minutesPerSession: number | null
    place: typeof PLACES[number] | null
    equipment: string | null
    injuries: string | null
    preferences: string | null
    heightCm: number | null
}

// A missing field stays as it is; null clears it.
export type CoachProfileChanges = Partial<CoachProfile>

export interface CoachExercise {
    name: string
    sets: number
    reps: string
    weightLb: number | null
    restSeconds: number | null
    notes: string | null
}

export interface CoachRoutine {
    id: string
    name: string
    exercises: CoachExercise[]
}

export interface CoachPlan {
    id: string
    name: string
    goal: string | null
    notes: string | null
    status: 'active' | 'closed'
    startedOn: string
    durationWeeks: number
    daysPerWeek: number
    routines: CoachRoutine[]
    closedOn: string | null
}

// A plan Elber prepared, waiting for the user to start it in the page.
export interface CoachReadyPlan {
    name: string
    goal: string | null
    notes: string | null
    durationWeeks: number
    daysPerWeek: number
    routines: CoachRoutine[]
    preparedOn: string
}

// A routine with the id of one the plan has keeps it; without one it's new.
export interface CoachPlanDraft {
    name: string
    goal: string | null
    notes: string | null
    durationWeeks: number
    daysPerWeek: number
    routines: {id?: string, name: string, exercises: CoachExercise[]}[]
}

// Outcomes the model must react to. INVALID_DATA's message names the field.
export type CoachError =
    | {error: 'INVALID_DATA', message: string}
    | {error: 'PLAN_ALREADY_ACTIVE'}
    | {error: 'PLAN_CLOSED'}
    | {error: 'PLAN_NOT_FOUND'}
    | {error: 'NO_READY_PLAN'}

// How the user is doing (streak, next routine, recent days, progress,
// measurements). The skill only hands it to the model, so it doesn't
// depend on its exact shape.
export interface CoachProgress {
    exercises: {name: string}[]
}

// Dates are YYYY-MM-DD. There is no way to start or close plans or to mark
// days: only the user does that, in the training page.
export interface TrainingCoach {
    getProfile(uid: string): Promise<CoachProfile>
    updateProfile(uid: string, changes: CoachProfileChanges): Promise<CoachProfile | CoachError>
    getActivePlan(uid: string): Promise<CoachPlan | null>
    getReadyPlan(uid: string): Promise<CoachReadyPlan | null>
    // Replaces the plan that was ready, if any.
    preparePlan(uid: string, draft: CoachPlanDraft, preparedOn: string): Promise<CoachReadyPlan | CoachError>
    updateReadyPlan(uid: string, draft: CoachPlanDraft): Promise<CoachReadyPlan | CoachError>
    updatePlan(uid: string, planId: string, draft: CoachPlanDraft): Promise<CoachPlan | CoachError>
    getProgress(uid: string, today: string): Promise<CoachProgress>
}
