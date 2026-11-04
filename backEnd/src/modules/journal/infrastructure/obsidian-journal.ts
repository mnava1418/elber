import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { MONTH } from '../domain/entries.js'
import type { JournalStore } from '../domain/journal-store.port.js'

// The diary's own folder inside Elber's. The chat's tools only reach their own
// files and Elber/Notas/, so they can never read it.
const DIARY_FOLDER = path.join('Elber', 'Diario')
const EXTENSION = '.md'

// Adapter: each month is <vault>/Elber/Diario/YYYY-MM.md, a plain Markdown file
// that Obsidian shows as soon as it changes on disk.
class ObsidianJournal implements JournalStore {
    private readonly folder: string

    constructor(vaultPath: string) {
        this.folder = path.join(vaultPath, DIARY_FOLDER)
    }

    readMonth = async (month: string) => {
        try {
            return await readFile(this.fileOf(month), 'utf8')
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
            throw error
        }
    }

    // Through a temporary file and a rename, so Obsidian (or a crash) never
    // sees half a month. Its name starts with a dot: Obsidian doesn't list it.
    writeMonth = async (month: string, text: string) => {
        const file = this.fileOf(month)
        await mkdir(this.folder, {recursive: true})
        const temporary = path.join(this.folder, `.${month}${EXTENSION}.tmp`)
        await writeFile(temporary, text, 'utf8')
        await rename(temporary, file)
    }

    listMonths = async () => {
        let files: string[]
        try {
            files = await readdir(this.folder)
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
            throw error
        }
        return files
            .filter((file) => file.endsWith(EXTENSION) && MONTH.test(file.slice(0, -EXTENSION.length)))
            .map((file) => file.slice(0, -EXTENSION.length))
            .sort()
    }

    // The month is checked again here: a path made from anything else could
    // leave the folder.
    private fileOf = (month: string) => {
        if (!MONTH.test(month)) throw new Error(`Invalid diary month: ${month}`)
        return path.join(this.folder, `${month}${EXTENSION}`)
    }
}

export default ObsidianJournal
