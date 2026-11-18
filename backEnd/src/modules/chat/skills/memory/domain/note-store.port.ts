import type { Note } from './notes.js'

// Port: where the owner's notes live. The Obsidian vault is an adapter in
// infrastructure/ implementing it. Titles come already cleaned (cleanTitle).
export interface NoteStore {
    // Every note.
    list(): Promise<Note[]>
    // The note with that title, ignoring case; null when there is none.
    read(title: string): Promise<Note | null>
    // Creates the note, or replaces the one with its title. Properties the
    // owner added to it (in Obsidian) are kept.
    write(note: Note): Promise<void>
}
