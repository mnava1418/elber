import type { ProfileStore } from '../domain/profile-store.port.js'

// The profile Elber reads before answering. null for anyone but the vault's
// owner, and while there is nothing in it yet.
class GetProfileUseCase {
    constructor(private readonly profile: ProfileStore, private readonly ownerUid: string) {}

    execute = async (uid: string): Promise<string | null> => {
        if (uid !== this.ownerUid) return null
        const note = (await this.profile.read()).trim()
        return note === '' ? null : note
    }
}

export default GetProfileUseCase
