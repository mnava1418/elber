import { addDays } from '../domain/days.js'
import {
    InvalidTrainingDataError, PlanAlreadyActiveError, PlanClosedError, PlanNotFoundError, ReadyPlanNotFoundError,
} from '../domain/errors.js'
import type { PlanDraft } from '../domain/plan.js'
import type { ProfileChanges } from '../domain/profile.js'
import type { TrainingUseCases } from './training.controller.js'

// How far back the coach sees the days trained, to answer "¿cómo voy?".
const RECENT_DAYS = 28

// Outcomes the model reacts to (it explains them), instead of failing.
export type CoachError =
    | {error: 'INVALID_DATA', message: string}
    | {error: 'PLAN_ALREADY_ACTIVE'}
    | {error: 'PLAN_CLOSED'}
    | {error: 'PLAN_NOT_FOUND'}
    | {error: 'NO_READY_PLAN'}

const attempt = async <T>(action: () => Promise<T>): Promise<T | CoachError> => {
    try {
        return await action()
    } catch (error) {
        if (error instanceof InvalidTrainingDataError) return {error: 'INVALID_DATA', message: error.message}
        if (error instanceof PlanAlreadyActiveError) return {error: 'PLAN_ALREADY_ACTIVE'}
        if (error instanceof PlanClosedError) return {error: 'PLAN_CLOSED'}
        if (error instanceof PlanNotFoundError) return {error: 'PLAN_NOT_FOUND'}
        if (error instanceof ReadyPlanNotFoundError) return {error: 'NO_READY_PLAN'}
        throw error
    }
}

// Inbound adapter for the chat's coach skill: what Elber may do with the
// training data. app.ts hands it to the chat, which never imports this
// module: the skill declares the shape it needs and this object fits it.
// Elber prepares plans but can't start or close them, mark days or touch
// measurements: that is the page's job, so there is no method for it.
export const buildCoach = (useCases: TrainingUseCases) => ({
    getProfile: (uid: string) => useCases.profile.get(uid),

    updateProfile: (uid: string, changes: ProfileChanges) => attempt(() => useCases.profile.update(uid, changes)),

    getActivePlan: (uid: string) => useCases.plans.getActive(uid),

    getReadyPlan: (uid: string) => useCases.readyPlan.get(uid),

    // Leaves it ready for the user to start in the page, replacing the one
    // that was ready.
    preparePlan: (uid: string, draft: PlanDraft, preparedOn: string) => attempt(() => useCases.readyPlan.prepare(uid, draft, preparedOn)),

    updateReadyPlan: (uid: string, draft: PlanDraft) => attempt(() => useCases.readyPlan.update(uid, draft)),

    updatePlan: (uid: string, planId: string, draft: PlanDraft) => attempt(() => useCases.plans.update(uid, planId, draft)),

    // Read only: how the user is doing, for the model to read.
    getProgress: async (uid: string, today: string) => {
        const [summary, recentSessions, {exercises, measurements}] = await Promise.all([
            useCases.summary.execute(uid, today),
            useCases.sessions.list(uid, {from: addDays(today, -RECENT_DAYS), to: today}),
            useCases.progress.execute(uid),
        ])
        return {summary, recentSessions, exercises, measurements}
    },
})

export type TrainingCoach = ReturnType<typeof buildCoach>
