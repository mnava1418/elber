import { localIsoDate } from '../../../../../shared/dates/local-date.js'
import type {
    CoachError, CoachPlan, CoachPlanDraft, CoachProfile, CoachProfileChanges, CoachProgress, CoachReadyPlan, TrainingCoach,
} from '../domain/training-coach.port.js'

export type PlansResult = {
    activePlan: CoachPlan | null
    // The plan prepared and waiting for the user to start it.
    readyPlan: CoachReadyPlan | null
    // Every exercise the user has had in a plan, to reuse its exact name:
    // the progress charts follow an exercise by its name.
    knownExercises: string[]
}

// Which plan Elber changes: the one ready to start or the one under way.
export type PlanTarget = 'ready' | 'active'

export type ReadyPlanResult = CoachReadyPlan | CoachError
export type ActivePlanResult = CoachPlan | CoachError | {error: 'NO_ACTIVE_PLAN'}

// Elber as the user's coach. Profile and plans only: the days trained and
// the measurements are the page's, and Elber only reads them. He prepares
// plans; the user starts them in the page.
class CoachUseCase {
    constructor(
        private readonly coach: TrainingCoach,
        // The coach's guide (how to build a plan), served when the model asks.
        private readonly guideText: string,
        // A parameter so tests can fix it. The server's day, as in the date
        // the model is told.
        private readonly today: () => string = localIsoDate,
    ) {}

    guide = (): {guide: string} => ({guide: this.guideText})

    profile = (uid: string): Promise<CoachProfile> => this.coach.getProfile(uid)

    updateProfile = (uid: string, changes: CoachProfileChanges) => this.coach.updateProfile(uid, changes)

    plans = async (uid: string): Promise<PlansResult> => {
        const [activePlan, readyPlan, progress] = await Promise.all([
            this.coach.getActivePlan(uid), this.coach.getReadyPlan(uid), this.coach.getProgress(uid, this.today()),
        ])
        return {activePlan, readyPlan, knownExercises: progress.exercises.map((exercise) => exercise.name)}
    }

    // Leaves it ready to start (replacing the one that was), even with a
    // plan active: the user may prepare the next one before finishing.
    createPlan = (uid: string, draft: CoachPlanDraft): Promise<ReadyPlanResult> => this.coach.preparePlan(uid, draft, this.today())

    // Elber only edits the ready plan or the active one, so he never needs an
    // id from the user.
    updatePlan = async (uid: string, target: PlanTarget, draft: CoachPlanDraft): Promise<ReadyPlanResult | ActivePlanResult> => {
        if (target === 'ready') return this.coach.updateReadyPlan(uid, draft)
        const active = await this.coach.getActivePlan(uid)
        if (active === null) return {error: 'NO_ACTIVE_PLAN'}
        return this.coach.updatePlan(uid, active.id, draft)
    }

    progress = (uid: string): Promise<CoachProgress> => this.coach.getProgress(uid, this.today())
}

export default CoachUseCase
