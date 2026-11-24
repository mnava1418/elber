import type { BodyMeasurement, MeasurementDraft } from './measurement.js'
import type { Plan } from './plan.js'
import type { TrainingProfile } from './profile.js'
import type { TrainingSession } from './session.js'

// Ports: where the training data is stored. Every method is scoped to a
// user: someone else's data is, for this user, data that doesn't exist.

export interface ProfileRepository {
    // null until it is saved for the first time.
    get(uid: string): Promise<TrainingProfile | null>
    save(uid: string, profile: TrainingProfile): Promise<void>
}

export interface PlanRepository {
    // Throws PlanAlreadyActiveError if the user already has an active plan,
    // checked atomically with the write.
    create(uid: string, plan: Omit<Plan, 'id'>): Promise<Plan>
    find(uid: string, planId: string): Promise<Plan | null>
    findActive(uid: string): Promise<Plan | null>
    // Newest first.
    list(uid: string): Promise<Plan[]>
    // Replaces a plan that exists.
    save(uid: string, plan: Plan): Promise<void>
}

export interface SessionRepository {
    // Replaces the session of that day, if there was one.
    put(uid: string, session: TrainingSession): Promise<void>
    // false if there was none that day.
    delete(uid: string, date: string): Promise<boolean>
    // Oldest first. Bounds are inclusive and optional.
    list(uid: string, range?: {from?: string, to?: string}): Promise<TrainingSession[]>
}

export interface MeasurementRepository {
    add(uid: string, measurement: MeasurementDraft): Promise<BodyMeasurement>
    // false if it didn't exist.
    delete(uid: string, measurementId: string): Promise<boolean>
    // Oldest first.
    list(uid: string): Promise<BodyMeasurement[]>
}
