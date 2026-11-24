import { randomUUID } from 'node:crypto'
import { PlanAlreadyActiveError, PlanClosedError, PlanNotFoundError, InvalidTrainingDataError } from '../domain/errors.js'
import { assignRoutineIds, validatePlanDraft, type Plan, type PlanDraft } from '../domain/plan.js'
import type { PlanRepository } from '../domain/training.repositories.js'
import { checkDate } from '../domain/validation.js'

// Training plans: one active at a time, the rest is history. Elber and the
// page create and edit them; only the page closes them (that is up to the
// entry points, not to this use case).
class ManagePlansUseCase {
    constructor(
        private readonly plans: PlanRepository,
        // A parameter so tests get predictable routine ids.
        private readonly newId: () => string = () => randomUUID().slice(0, 8),
    ) {}

    getActive = (uid: string): Promise<Plan | null> => this.plans.findActive(uid)

    // Newest first.
    list = (uid: string): Promise<Plan[]> => this.plans.list(uid)

    // Throws PlanNotFoundError if it doesn't exist or is someone else's.
    get = async (uid: string, planId: string): Promise<Plan> => {
        const plan = await this.plans.find(uid, planId)
        if (plan === null) throw new PlanNotFoundError(planId)
        return plan
    }

    // Starts it on `startedOn` (the user's today). Throws
    // PlanAlreadyActiveError while another one is active, and
    // InvalidTrainingDataError if the plan breaks a rule.
    create = async (uid: string, draft: PlanDraft, startedOn: string): Promise<Plan> => {
        checkDate('startedOn', startedOn)
        const {routines, ...fields} = validatePlanDraft(draft)
        // Checked here for a clear answer; the repository checks it again
        // atomically, in case two creations race.
        if (await this.plans.findActive(uid) !== null) throw new PlanAlreadyActiveError()
        return this.plans.create(uid, {
            ...fields,
            status: 'active',
            startedOn,
            closedOn: null,
            routines: assignRoutineIds(routines, [], this.newId),
        })
    }

    // Replaces what the plan says (name, routines...). Its status and dates
    // stay. Only the active plan can be edited: closed ones are history.
    update = async (uid: string, planId: string, draft: PlanDraft): Promise<Plan> => {
        const plan = await this.get(uid, planId)
        if (plan.status === 'closed') throw new PlanClosedError(planId)
        const {routines, ...fields} = validatePlanDraft(draft)
        const updated: Plan = {...plan, ...fields, routines: assignRoutineIds(routines, plan.routines, this.newId)}
        await this.plans.save(uid, updated)
        return updated
    }

    // Moves it to the history on `closedOn` (the user's today).
    close = async (uid: string, planId: string, closedOn: string): Promise<Plan> => {
        checkDate('closedOn', closedOn)
        const plan = await this.get(uid, planId)
        if (plan.status === 'closed') throw new PlanClosedError(planId)
        if (closedOn < plan.startedOn) throw new InvalidTrainingDataError('closedOn is before the plan started')
        const closed: Plan = {...plan, status: 'closed', closedOn}
        await this.plans.save(uid, closed)
        return closed
    }
}

export default ManagePlansUseCase
