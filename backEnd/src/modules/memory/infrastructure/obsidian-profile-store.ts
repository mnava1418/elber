import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ProfileStore } from '../domain/profile-store.port.js'

// Elber writes only inside this folder of the vault: a mistake of its own
// never touches the owner's notes.
const ELBER_FOLDER = 'Elber'
const PROFILE_NOTE = 'Perfil.md'

// Adapter: the profile is <vault>/Elber/Perfil.md, a plain Markdown file that
// Obsidian shows as soon as it changes on disk.
class ObsidianProfileStore implements ProfileStore {
    private readonly file: string

    constructor(vaultPath: string) {
        this.file = path.join(vaultPath, ELBER_FOLDER, PROFILE_NOTE)
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
        const temporary = path.join(path.dirname(this.file), `.${PROFILE_NOTE}.tmp`)
        await writeFile(temporary, note, 'utf8')
        await rename(temporary, this.file)
    }
}

export default ObsidianProfileStore
