import { localIsoDate } from '../../../shared/dates/local-date.js'
import type { NoteStore } from '../domain/note-store.port.js'
import { appendToBody, cleanTags, cleanTitle, searchNotes, type Note, type NoteSummary, type NoteType } from '../domain/notes.js'
import { serial } from './serial.js'

// Notes a search gives at most: enough to choose, without filling the context.
const SEARCH_LIMIT = 10

export interface SaveNoteInput {
    title: string
    type: NoteType
    tags: string[]
    content: string
}

export interface ReadNoteInput {
    title: string
}

export interface UpdateNoteInput {
    title: string
    content: string
    // append: adds to the end (developing an idea); replace: rewrites the text.
    mode: 'append' | 'replace'
}

// The model reads these and reacts: on ALREADY_EXISTS it reads and extends
// the note instead of making a second one. `title` is the name the note got
// (cleaned), so it can link to it.
export type SaveNoteResult = {saved: true, title: string} | {error: 'ALREADY_EXISTS', title: string} | {error: 'INVALID_TITLE'} | {error: 'MEMORY_UNAVAILABLE'}
export type SearchNotesResult = {notes: NoteSummary[]} | {error: 'MEMORY_UNAVAILABLE'}
export type ReadNoteResult = {note: Note} | {error: 'NOT_FOUND'} | {error: 'MEMORY_UNAVAILABLE'}
export type UpdateNoteResult = {updated: true} | {error: 'NOT_FOUND'} | {error: 'MEMORY_UNAVAILABLE'}

// The vault owner's ideas and projects. Like the profile, nobody else has them.
class ManageNotesUseCase {
    // Saves and updates read a note and write it back.
    private readonly inTurn = serial()

    constructor(
        private readonly notes: NoteStore,
        private readonly ownerUid: string,
        // The day for the notes' dates. A parameter so tests can fix it.
        private readonly today: () => string = localIsoDate,
    ) {}

    save = async ({title, type, tags, content}: SaveNoteInput, uid: string): Promise<SaveNoteResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        const clean = cleanTitle(title)
        if (clean === null) return {error: 'INVALID_TITLE'}

        return this.inTurn(async () => {
            const existing = await this.notes.read(clean)
            if (existing !== null) return {error: 'ALREADY_EXISTS', title: existing.title}
            const today = this.today()
            await this.notes.write({title: clean, type, tags: cleanTags(tags), created: today, updated: today, body: `${content.trim()}\n`})
            return {saved: true, title: clean}
        })
    }

    search = async (query: string, uid: string): Promise<SearchNotesResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        return {notes: searchNotes(await this.notes.list(), query, SEARCH_LIMIT)}
    }

    read = async ({title}: ReadNoteInput, uid: string): Promise<ReadNoteResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}
        const note = await this.find(title)
        return note === null ? {error: 'NOT_FOUND'} : {note}
    }

    update = async ({title, content, mode}: UpdateNoteInput, uid: string): Promise<UpdateNoteResult> => {
        if (uid !== this.ownerUid) return {error: 'MEMORY_UNAVAILABLE'}

        return this.inTurn(async () => {
            const note = await this.find(title)
            if (note === null) return {error: 'NOT_FOUND'}
            const body = mode === 'append' ? appendToBody(note.body, content) : `${content.trim()}\n`
            await this.notes.write({...note, updated: this.today(), body})
            return {updated: true}
        })
    }

    private find = async (title: string): Promise<Note | null> => {
        const clean = cleanTitle(title)
        return clean === null ? null : this.notes.read(clean)
    }
}

export default ManageNotesUseCase
