import type { DocumentSnapshot, Firestore } from 'firebase-admin/firestore'
import { PlanAlreadyActiveError } from '../domain/errors.js'
import type { BodyMeasurement, MeasurementDraft } from '../domain/measurement.js'
import type { Plan } from '../domain/plan.js'
import { EMPTY_PROFILE, type TrainingProfile } from '../domain/profile.js'
import type { TrainingSession } from '../domain/session.js'
import type { MeasurementRepository, PlanRepository, ProfileRepository, SessionRepository } from '../domain/training.repositories.js'

// Adapters: the training data in Firestore, under its user, so a lookup can
// never reach someone else's:
//   users/{uid}/training/profile                 the profile's fields
//   users/{uid}/trainingPlans/{planId}           the plan, routines included (a plan is small)
//   users/{uid}/trainingSessions/{YYYY-MM-DD}    one per day: the date is the id
//   users/{uid}/bodyMeasurements/{id}
// Every read picks its fields one by one: whatever else a document has stays
// here. Single-field indexes are enough for every query.

const user = (db: Firestore, uid: string) => db.collection('users').doc(uid)

export class FirestoreProfileRepository implements ProfileRepository {
    constructor(private readonly db: Firestore) {}

    async get(uid: string): Promise<TrainingProfile | null> {
        const snapshot = await this.doc(uid).get()
        if (!snapshot.exists) return null
        const data = snapshot.data()!
        // A field missing in the document is unknown (null).
        const profile = {...EMPTY_PROFILE}
        for (const key of Object.keys(EMPTY_PROFILE) as (keyof TrainingProfile)[]) {
            (profile as Record<string, unknown>)[key] = data[key] ?? null
        }
        return profile
    }

    async save(uid: string, profile: TrainingProfile): Promise<void> {
        await this.doc(uid).set(profile)
    }

    private doc(uid: string) {
        return user(this.db, uid).collection('training').doc('profile')
    }
}

export class FirestorePlanRepository implements PlanRepository {
    constructor(private readonly db: Firestore) {}

    async create(uid: string, plan: Omit<Plan, 'id'>): Promise<Plan> {
        const ref = this.plans(uid).doc()
        // Reading the active plan inside the transaction makes "only one
        // active plan" hold even if two creations race.
        await this.db.runTransaction(async (tx) => {
            const active = await tx.get(this.plans(uid).where('status', '==', 'active').limit(1))
            if (!active.empty) throw new PlanAlreadyActiveError()
            tx.create(ref, plan)
        })
        return {id: ref.id, ...plan}
    }

    async find(uid: string, planId: string): Promise<Plan | null> {
        const snapshot = await this.plans(uid).doc(planId).get()
        return snapshot.exists ? toPlan(snapshot) : null
    }

    async findActive(uid: string): Promise<Plan | null> {
        const snapshot = await this.plans(uid).where('status', '==', 'active').limit(1).get()
        const doc = snapshot.docs[0]
        return doc ? toPlan(doc) : null
    }

    async list(uid: string): Promise<Plan[]> {
        const snapshot = await this.plans(uid).orderBy('startedOn', 'desc').get()
        return snapshot.docs.map(toPlan)
    }

    async save(uid: string, {id, ...plan}: Plan): Promise<void> {
        await this.plans(uid).doc(id).set(plan)
    }

    private plans(uid: string) {
        return user(this.db, uid).collection('trainingPlans')
    }
}

const toPlan = (doc: DocumentSnapshot): Plan => {
    const data = doc.data()!
    return {
        id: doc.id,
        name: data.name,
        goal: data.goal ?? null,
        notes: data.notes ?? null,
        status: data.status,
        startedOn: data.startedOn,
        durationWeeks: data.durationWeeks,
        daysPerWeek: data.daysPerWeek,
        closedOn: data.closedOn ?? null,
        routines: (data.routines ?? []).map((routine: Plan['routines'][number]) => ({
            id: routine.id,
            name: routine.name,
            exercises: (routine.exercises ?? []).map((exercise) => ({
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                weightKg: exercise.weightKg ?? null,
                restSeconds: exercise.restSeconds ?? null,
                notes: exercise.notes ?? null,
            })),
        })),
    }
}

export class FirestoreSessionRepository implements SessionRepository {
    constructor(private readonly db: Firestore) {}

    async put(uid: string, session: TrainingSession): Promise<void> {
        await this.sessions(uid).doc(session.date).set(session)
    }

    async delete(uid: string, date: string): Promise<boolean> {
        const ref = this.sessions(uid).doc(date)
        if (!(await ref.get()).exists) return false
        await ref.delete()
        return true
    }

    async list(uid: string, {from, to}: {from?: string, to?: string} = {}): Promise<TrainingSession[]> {
        let query = this.sessions(uid).orderBy('date', 'asc')
        if (from !== undefined) query = query.where('date', '>=', from)
        if (to !== undefined) query = query.where('date', '<=', to)
        const snapshot = await query.get()
        return snapshot.docs.map((doc) => {
            const data = doc.data()
            return {date: data.date, planId: data.planId ?? null, routineId: data.routineId ?? null, routineName: data.routineName ?? null}
        })
    }

    private sessions(uid: string) {
        return user(this.db, uid).collection('trainingSessions')
    }
}

export class FirestoreMeasurementRepository implements MeasurementRepository {
    constructor(private readonly db: Firestore) {}

    async add(uid: string, measurement: MeasurementDraft): Promise<BodyMeasurement> {
        const ref = await this.measurements(uid).add(measurement)
        return {id: ref.id, ...measurement}
    }

    async delete(uid: string, measurementId: string): Promise<boolean> {
        const ref = this.measurements(uid).doc(measurementId)
        if (!(await ref.get()).exists) return false
        await ref.delete()
        return true
    }

    async list(uid: string): Promise<BodyMeasurement[]> {
        const snapshot = await this.measurements(uid).orderBy('date', 'asc').get()
        return snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                date: data.date,
                weightKg: data.weightKg,
                bodyFatPct: data.bodyFatPct ?? null,
                waistCm: data.waistCm ?? null,
                hipCm: data.hipCm ?? null,
                chestCm: data.chestCm ?? null,
                armCm: data.armCm ?? null,
                thighCm: data.thighCm ?? null,
            }
        })
    }

    private measurements(uid: string) {
        return user(this.db, uid).collection('bodyMeasurements')
    }
}
