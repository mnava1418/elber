import { addFact, removeFact, type ProfileEdit } from '../domain/profile.js'
import type { ProfileStore } from '../domain/profile-store.port.js'

export interface RememberInput {
    // A "## Section" of the profile, e.g. "Gustos". Created if it doesn't exist.
    section: string
    fact: string
}

export interface ForgetInput {
    // As it appears in the profile.
    fact: string
}

// The model reads these and reacts: it doesn't claim to have learned (or
// forgotten) something when nothing changed.
export type RememberResult = {remembered: true} | {error: 'ALREADY_KNOWN'} | {error: 'MEMORY_UNAVAILABLE'}
export type ForgetResult = {forgotten: true} | {error: 'NOT_FOUND'} | {error: 'MEMORY_UNAVAILABLE'}

// Elber learns or forgets facts about the vault's owner. Nobody else has a
// profile: the vault is the owner's.
class EditProfileUseCase {
    // Edits run one after another: two at once would both read the old note,
    // and the second write would drop the first one's fact.
    private queue: Promise<unknown> = Promise.resolve()

    constructor(private readonly profile: ProfileStore, private readonly ownerUid: string) {}

    remember = async ({section, fact}: RememberInput, uid: string): Promise<RememberResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        const changed = await this.edit((note) => addFact(note, section, fact))
        return changed ? {remembered: true} : {error: 'ALREADY_KNOWN'}
    }

    forget = async ({fact}: ForgetInput, uid: string): Promise<ForgetResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        const changed = await this.edit((note) => removeFact(note, fact))
        return changed ? {forgotten: true} : {error: 'NOT_FOUND'}
    }

    // Reads, edits and writes the note in turn. A failed edit doesn't stop
    // the ones queued after it.
    private edit = (change: (note: string) => ProfileEdit): Promise<boolean> => {
        const run = this.queue.then(async () => {
            const {note, changed} = change(await this.profile.read())
            if (changed) await this.profile.write(note)
            return changed
        })
        this.queue = run.catch(() => {})
        return run
    }
}

export default EditProfileUseCase
