import { MeasurementNotFoundError } from '../domain/errors.js'
import { validateMeasurement, type BodyMeasurement, type MeasurementDraft } from '../domain/measurement.js'
import type { MeasurementRepository } from '../domain/training.repositories.js'

// The user's body measurements, registered in the page whenever they want.
class ManageMeasurementsUseCase {
    constructor(private readonly measurements: MeasurementRepository) {}

    // Throws InvalidTrainingDataError if a value breaks a rule.
    add = async (uid: string, draft: MeasurementDraft): Promise<BodyMeasurement> =>
        this.measurements.add(uid, validateMeasurement(draft))

    // Throws MeasurementNotFoundError if it doesn't exist or is someone else's.
    delete = async (uid: string, measurementId: string): Promise<void> => {
        if (!(await this.measurements.delete(uid, measurementId))) throw new MeasurementNotFoundError(measurementId)
    }

    // Oldest first.
    list = (uid: string): Promise<BodyMeasurement[]> => this.measurements.list(uid)
}

export default ManageMeasurementsUseCase
