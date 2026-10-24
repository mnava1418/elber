import type { NoteEdit } from '../domain/note-lines.js'
import type { NoteFile } from '../domain/note-file.port.js'

// Reads, edits and writes a note, one edit after another: two at once would
// both read the old note, and the second write would drop the first one's
// change. A failed edit doesn't stop the ones queued after it.
class NoteEditor {
    private queue: Promise<unknown> = Promise.resolve()

    constructor(private readonly file: NoteFile) {}

    // Resolves to whether the note changed.
    edit = (change: (note: string) => NoteEdit): Promise<boolean> => {
        const run = this.queue.then(async () => {
            const {note, changed} = change(await this.file.read())
            if (changed) await this.file.write(note)
            return changed
        })
        this.queue = run.catch(() => {})
        return run
    }
}

export default NoteEditor
