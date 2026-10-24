import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { NoteFile } from '../domain/note-file.port.js'

// Elber writes only inside this folder of the vault: a mistake of its own
// never touches the owner's notes.
const ELBER_FOLDER = 'Elber'

// Adapter: a note is <vault>/Elber/<name>, a plain Markdown file that
// Obsidian shows as soon as it changes on disk. `name` is fixed in code
// (Perfil.md...), never chosen by the model.
class ObsidianNoteFile implements NoteFile {
    private readonly file: string

    constructor(vaultPath: string, private readonly name: string) {
        this.file = path.join(vaultPath, ELBER_FOLDER, name)
    }

    read = async () => {
        try {
            return await readFile(this.file, 'utf8')
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
            throw error
        }
    }

    // Through a temporary file and a rename, so Obsidian (or a crash) never
    // sees half a note. Its name starts with a dot: Obsidian doesn't list it.
    write = async (note: string) => {
        await mkdir(path.dirname(this.file), {recursive: true})
        const temporary = path.join(path.dirname(this.file), `.${this.name}.tmp`)
        await writeFile(temporary, note, 'utf8')
        await rename(temporary, this.file)
    }
}

export default ObsidianNoteFile
