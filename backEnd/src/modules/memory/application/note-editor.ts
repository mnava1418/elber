import type { NoteEdit } from '../domain/note-lines.js'
import type { NoteFile } from '../domain/note-file.port.js'
import { serial } from './serial.js'

// Reads, edits and writes a note, one edit after another.
class NoteEditor {
    private readonly inTurn = serial()

    constructor(private readonly file: NoteFile) {}

    // Resolves to whether the note changed.
    edit = (change: (note: string) => NoteEdit): Promise<boolean> => this.inTurn(async () => {
        const {note, changed} = change(await this.file.read())
        if (changed) await this.file.write(note)
        return changed
    })
}

export default NoteEditor
