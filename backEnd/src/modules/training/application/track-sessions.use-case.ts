import { InvalidTrainingDataError, RoutineNotFoundError, SessionNotFoundError } from '../domain/errors.js'
import type { TrainingSession } from '../domain/session.js'
import type { PlanRepository, SessionRepository } from '../domain/training.repositories.js'
import { checkDate } from '../domain/validation.js'

export interface MarkSessionInput {
    date: string
    // A routine of the active plan, or null to only mark the day.
    routineId: string | null
    // The user's today, from their device: a session can't be in the future.
    today: string
}

// The days the user trained, marked in the page. One per day: marking a day
// again replaces it (they picked the wrong routine).
class TrackSessionsUseCase {
    constructor(
        private readonly sessions: SessionRepository,
        private readonly plans: PlanRepository,
    ) {}

    // Throws InvalidTrainingDataError for a bad or future date and
    // RoutineNotFoundError for a routine that isn't in the active plan.
    mark = async (uid: string, {date, routineId, today}: MarkSessionInput): Promise<TrainingSession> => {
        checkDate('date', date)
        checkDate('today', today)
        if (date > today) throw new InvalidTrainingDataError("date can't be in the future")

        // Without a plan the day still counts: the streak goes on between plans.
        // A past day before the active plan started wasn't part of it.
        const active = await this.plans.findActive(uid)
        const plan = active !== null && date >= active.startedOn ? active : null
        const routine = routineId === null ? null : plan?.routines.find((r) => r.id === routineId)
        if (routineId !== null && !routine) throw new RoutineNotFoundError(routineId)

        const session: TrainingSession = {date, planId: plan?.id ?? null, routineId, routineName: routine?.name ?? null}
        await this.sessions.put(uid, session)
        return session
    }

    // Throws SessionNotFoundError if that day wasn't marked.
    unmark = async (uid: string, date: string): Promise<void> => {
        checkDate('date', date)
        if (!(await this.sessions.delete(uid, date))) throw new SessionNotFoundError(date)
    }

    // Oldest first; bounds inclusive.
    list = async (uid: string, range: {from?: string, to?: string} = {}): Promise<TrainingSession[]> => {
        if (range.from !== undefined) checkDate('from', range.from)
        if (range.to !== undefined) checkDate('to', range.to)
        return this.sessions.list(uid, range)
    }
}

export default TrackSessionsUseCase
