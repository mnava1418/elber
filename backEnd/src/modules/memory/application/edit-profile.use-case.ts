import { addFact, removeFact } from '../domain/profile.js'
import type { NoteFile } from '../domain/note-file.port.js'
import NoteEditor from './note-editor.js'

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
    private readonly profile: NoteEditor

    constructor(profile: NoteFile, private readonly ownerUid: string) {
        this.profile = new NoteEditor(profile)
    }

    remember = async ({section, fact}: RememberInput, uid: string): Promise<RememberResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        const changed = await this.profile.edit((note) => addFact(note, section, fact))
        return changed ? {remembered: true} : {error: 'ALREADY_KNOWN'}
    }

    forget = async ({fact}: ForgetInput, uid: string): Promise<ForgetResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        const changed = await this.profile.edit((note) => removeFact(note, fact))
        return changed ? {forgotten: true} : {error: 'NOT_FOUND'}
    }
}

export default EditProfileUseCase
