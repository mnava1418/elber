import type { BodyMeasurement } from '../domain/measurement.js'
import { exerciseSeries, type ExerciseSeries } from '../domain/progress.js'
import type { MeasurementRepository, PlanRepository } from '../domain/training.repositories.js'

export interface TrainingProgress {
    // Each exercise's targets from plan to plan.
    exercises: ExerciseSeries[]
    // Oldest first.
    measurements: BodyMeasurement[]
}

// The data behind the progress charts.
class GetProgressUseCase {
    constructor(
        private readonly plans: PlanRepository,
        private readonly measurements: MeasurementRepository,
    ) {}

    execute = async (uid: string): Promise<TrainingProgress> => {
        const [plans, measurements] = await Promise.all([this.plans.list(uid), this.measurements.list(uid)])
        return {exercises: exerciseSeries(plans), measurements}
    }
}

export default GetProgressUseCase
