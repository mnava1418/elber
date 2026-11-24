import { measurementDue, type BodyMeasurement } from '../domain/measurement.js'
import { plannedEndOf } from '../domain/plan.js'
import { nextRoutine, type TrainingSession } from '../domain/session.js'
import { computeStreak, weeklyTarget, type Streak } from '../domain/streak.js'
import type { MeasurementRepository, PlanRepository, ProfileRepository, SessionRepository } from '../domain/training.repositories.js'
import { checkDate } from '../domain/validation.js'

export interface TrainingSummary {
    today: string
    // The session marked today, if any.
    todaySession: TrainingSession | null
    streak: Streak
    activePlan: {id: string, name: string, startedOn: string, plannedEndOn: string} | null
    // What the rotation suggests doing next. null without an active plan.
    nextRoutine: {id: string, name: string} | null
    lastMeasurement: BodyMeasurement | null
    // A month has passed since the last measurement (or there is none).
    measurementDue: boolean
}

// What the training page shows first, and what Elber reads to know how the
// user is doing. `today` is the user's, from their device.
class GetSummaryUseCase {
    constructor(
        private readonly profiles: ProfileRepository,
        private readonly plans: PlanRepository,
        private readonly sessions: SessionRepository,
        private readonly measurements: MeasurementRepository,
    ) {}

    execute = async (uid: string, today: string): Promise<TrainingSummary> => {
        checkDate('today', today)
        const [profile, plans, sessions, measurements] = await Promise.all([
            this.profiles.get(uid),
            this.plans.list(uid),
            this.sessions.list(uid, {to: today}),
            this.measurements.list(uid),
        ])
        const active = plans.find((plan) => plan.status === 'active') ?? null
        const next = active === null ? null : nextRoutine(active, sessions)
        const lastMeasurement = measurements.at(-1) ?? null

        return {
            today,
            todaySession: sessions.find((session) => session.date === today) ?? null,
            streak: computeStreak(sessions.map((s) => s.date), today, (week) => weeklyTarget(week, plans, profile?.daysPerWeek ?? null)),
            activePlan: active === null ? null : {id: active.id, name: active.name, startedOn: active.startedOn, plannedEndOn: plannedEndOf(active)},
            nextRoutine: next === null ? null : {id: next.id, name: next.name},
            lastMeasurement,
            measurementDue: measurementDue(lastMeasurement?.date ?? null, today),
        }
    }
}

export default GetSummaryUseCase
