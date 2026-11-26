import { PlanAlreadyActiveError } from '../../../src/modules/training/domain/errors.js'
import type { BodyMeasurement, MeasurementDraft } from '../../../src/modules/training/domain/measurement.js'
import type { Exercise, Plan, PlanDraft, ReadyPlan } from '../../../src/modules/training/domain/plan.js'
import type { TrainingProfile } from '../../../src/modules/training/domain/profile.js'
import type { TrainingSession } from '../../../src/modules/training/domain/session.js'
import type {
    MeasurementRepository, PlanRepository, ProfileRepository, ReadyPlanRepository, SessionRepository,
} from '../../../src/modules/training/domain/training.repositories.js'

// The training repositories in memory, keyed by user like the real ones.

export class InMemoryProfiles implements ProfileRepository {
    readonly profiles = new Map<string, TrainingProfile>()

    async get(uid: string) {
        return this.profiles.get(uid) ?? null
    }

    async save(uid: string, profile: TrainingProfile) {
        this.profiles.set(uid, profile)
    }
}

export class InMemoryPlans implements PlanRepository {
    readonly plans = new Map<string, Plan & {uid: string}>()

    async create(uid: string, plan: Omit<Plan, 'id'>) {
        if (await this.findActive(uid)) throw new PlanAlreadyActiveError()
        const id = `plan${this.plans.size + 1}`
        this.plans.set(id, {id, uid, ...plan})
        return {id, ...plan}
    }

    async find(uid: string, planId: string) {
        const stored = this.plans.get(planId)
        return stored && stored.uid === uid ? strip(stored) : null
    }

    async findActive(uid: string) {
        return (await this.list(uid)).find((plan) => plan.status === 'active') ?? null
    }

    async list(uid: string) {
        return [...this.plans.values()]
            .filter((plan) => plan.uid === uid)
            .sort((a, b) => b.startedOn.localeCompare(a.startedOn))
            .map(strip)
    }

    async save(uid: string, plan: Plan) {
        this.plans.set(plan.id, {...plan, uid})
    }
}

export class InMemoryReadyPlans implements ReadyPlanRepository {
    readonly ready = new Map<string, ReadyPlan>()

    async get(uid: string) {
        return this.ready.get(uid) ?? null
    }

    async save(uid: string, plan: ReadyPlan) {
        this.ready.set(uid, plan)
    }

    async delete(uid: string) {
        this.ready.delete(uid)
    }
}

const strip = ({uid: _uid, ...plan}: Plan & {uid: string}): Plan => plan

export class InMemorySessions implements SessionRepository {
    readonly sessions = new Map<string, TrainingSession>()

    async put(uid: string, session: TrainingSession) {
        this.sessions.set(`${uid}/${session.date}`, session)
    }

    async delete(uid: string, date: string) {
        return this.sessions.delete(`${uid}/${date}`)
    }

    async list(uid: string, {from, to}: {from?: string, to?: string} = {}) {
        return [...this.sessions.entries()]
            .filter(([key]) => key.startsWith(`${uid}/`))
            .map(([, session]) => session)
            .filter(({date}) => (from === undefined || date >= from) && (to === undefined || date <= to))
            .sort((a, b) => a.date.localeCompare(b.date))
    }
}

export class InMemoryMeasurements implements MeasurementRepository {
    readonly measurements = new Map<string, BodyMeasurement & {uid: string}>()

    async add(uid: string, draft: MeasurementDraft) {
        const id = `m${this.measurements.size + 1}`
        this.measurements.set(id, {id, uid, ...draft})
        return {id, ...draft}
    }

    async delete(uid: string, measurementId: string) {
        if (this.measurements.get(measurementId)?.uid !== uid) return false
        return this.measurements.delete(measurementId)
    }

    async list(uid: string) {
        return [...this.measurements.values()]
            .filter((m) => m.uid === uid)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(({uid: _uid, ...m}) => m)
    }
}

export const exercise = (name: string, weightLb: number | null = null): Exercise =>
    ({name, sets: 3, reps: '8-10', weightLb, restSeconds: 90, notes: null})

// A valid plan with routines A, B and C.
export const planDraft = (changes: Partial<PlanDraft> = {}): PlanDraft => ({
    name: 'Fuerza base',
    goal: 'Ganar fuerza',
    notes: null,
    durationWeeks: 4,
    daysPerWeek: 3,
    routines: [
        {name: 'Día A: Pierna', exercises: [exercise('Sentadilla trasera', 60)]},
        {name: 'Día B: Empuje', exercises: [exercise('Press de banca', 50)]},
        {name: 'Día C: Jalón', exercises: [exercise('Dominadas')]},
    ],
    ...changes,
})
