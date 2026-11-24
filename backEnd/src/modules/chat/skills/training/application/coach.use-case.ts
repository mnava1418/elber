import { localIsoDate } from '../../../../../shared/dates/local-date.js'
import type {
    CoachError, CoachPlan, CoachPlanDraft, CoachProfile, CoachProfileChanges, CoachProgress, TrainingCoach,
} from '../domain/training-coach.port.js'

export type ActivePlanResult = {
    plan: CoachPlan | null
    // Every exercise the user has had in a plan, to reuse its exact name:
    // the progress charts follow an exercise by its name.
    knownExercises: string[]
}

export type PlanResult = CoachPlan | CoachError | {error: 'NO_ACTIVE_PLAN'}

// Elber as the user's coach. Profile and plans only: the days trained and
// the measurements are the page's, and Elber only reads them.
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

    activePlan = async (uid: string): Promise<ActivePlanResult> => {
        const [plan, progress] = await Promise.all([this.coach.getActivePlan(uid), this.coach.getProgress(uid, this.today())])
        return {plan, knownExercises: progress.exercises.map((exercise) => exercise.name)}
    }

    // Starts today. PLAN_ALREADY_ACTIVE while another one is active: only the
    // user can close it, in the page.
    createPlan = (uid: string, draft: CoachPlanDraft): Promise<PlanResult> => this.coach.createPlan(uid, draft, this.today())

    // Elber only edits the active plan, so it never needs an id from the user.
    updatePlan = async (uid: string, draft: CoachPlanDraft): Promise<PlanResult> => {
        const active = await this.coach.getActivePlan(uid)
        if (active === null) return {error: 'NO_ACTIVE_PLAN'}
        return this.coach.updatePlan(uid, active.id, draft)
    }

    progress = (uid: string): Promise<CoachProgress> => this.coach.getProgress(uid, this.today())
}

export default CoachUseCase
