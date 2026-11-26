import { randomUUID } from 'node:crypto'
import { InvalidTrainingDataError, PlanAlreadyActiveError, ReadyPlanNotFoundError } from '../domain/errors.js'
import { assignRoutineIds, validatePlanDraft, type Plan, type PlanDraft, type ReadyPlan } from '../domain/plan.js'
import type { PlanRepository, ReadyPlanRepository } from '../domain/training.repositories.js'
import { checkDate } from '../domain/validation.js'

// The plan ready to start. Elber prepares it and both he and the page edit
// it, but only the user starts it, from the page, on the day they begin.
class ManageReadyPlanUseCase {
    constructor(
        private readonly readyPlans: ReadyPlanRepository,
        private readonly plans: PlanRepository,
        // A parameter so tests get predictable routine ids.
        private readonly newId: () => string = () => randomUUID().slice(0, 8),
    ) {}

    get = (uid: string): Promise<ReadyPlan | null> => this.readyPlans.get(uid)

    // Replaces the one there was. Throws InvalidTrainingDataError if the
    // plan breaks a rule.
    prepare = async (uid: string, draft: PlanDraft, preparedOn: string): Promise<ReadyPlan> => {
        checkDate('preparedOn', preparedOn)
        const {routines, ...fields} = validatePlanDraft(draft)
        const ready: ReadyPlan = {...fields, routines: assignRoutineIds(routines, [], this.newId), preparedOn}
        await this.readyPlans.save(uid, ready)
        return ready
    }

    // Replaces what it says; routines that stay keep their id.
    update = async (uid: string, draft: PlanDraft): Promise<ReadyPlan> => {
        const ready = await this.find(uid)
        const {routines, ...fields} = validatePlanDraft(draft)
        const updated: ReadyPlan = {...ready, ...fields, routines: assignRoutineIds(routines, ready.routines, this.newId)}
        await this.readyPlans.save(uid, updated)
        return updated
    }

    discard = async (uid: string): Promise<void> => {
        await this.find(uid)
        await this.readyPlans.delete(uid)
    }

    // Makes it the active plan from `today` (the user's). With another plan
    // active, it closes that one today, but only if the user agreed
    // (closeActive); otherwise PlanAlreadyActiveError.
    start = async (uid: string, today: string, closeActive: boolean): Promise<Plan> => {
        checkDate('today', today)
        const ready = await this.find(uid)
        const active = await this.plans.findActive(uid)
        if (active !== null) {
            if (!closeActive) throw new PlanAlreadyActiveError()
            if (today < active.startedOn) throw new InvalidTrainingDataError('today is before the active plan started')
            await this.plans.save(uid, {...active, status: 'closed', closedOn: today})
        }
        const {preparedOn: _, ...fields} = ready
        const plan = await this.plans.create(uid, {...fields, status: 'active', startedOn: today, closedOn: null})
        await this.readyPlans.delete(uid)
        return plan
    }

    private find = async (uid: string): Promise<ReadyPlan> => {
        const ready = await this.readyPlans.get(uid)
        if (ready === null) throw new ReadyPlanNotFoundError()
        return ready
    }
}

export default ManageReadyPlanUseCase
