import { applyProfileChanges, EMPTY_PROFILE, type ProfileChanges, type TrainingProfile } from '../domain/profile.js'
import type { ProfileRepository } from '../domain/training.repositories.js'

// The user's training profile. Elber fills it in while talking and the user
// edits it in the page: both send only what changed.
class ManageProfileUseCase {
    constructor(private readonly profiles: ProfileRepository) {}

    // Everything unknown (null) until something is saved.
    get = async (uid: string): Promise<TrainingProfile> => (await this.profiles.get(uid)) ?? EMPTY_PROFILE

    // Throws InvalidTrainingDataError, saving nothing, if a field breaks a rule.
    update = async (uid: string, changes: ProfileChanges): Promise<TrainingProfile> => {
        const profile = applyProfileChanges(await this.get(uid), changes)
        await this.profiles.save(uid, profile)
        return profile
    }
}

export default ManageProfileUseCase
