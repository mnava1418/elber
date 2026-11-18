import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { isMap, parseDocument, stringify, type Document } from 'yaml'
import type { Note } from '../domain/notes.js'
import type { NoteStore } from '../domain/note-store.port.js'

// Inside Elber's folder of the vault, which is the only place it writes.
const NOTES_FOLDER = path.join('Elber', 'Notas')
const EXTENSION = '.md'

// The properties block at the top of a note: "---", YAML, "---", each
// "---" on a line of its own.
const FRONTMATTER = /^---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/

const isMissing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT'

const textOf = (value: unknown) => typeof value === 'string' && value.trim() !== '' ? value.trim() : null

// Obsidian accepts tags as a list or as one string ("a, b"), with or without "#".
const tagsOf = (value: unknown): string[] => {
    const tags = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,\s]+/) : []
    return tags.filter((tag) => typeof tag === 'string' && tag !== '').map((tag: string) => tag.replace(/^#/, ''))
}

interface Parsed {
    // null when the note has no properties, or they aren't valid ones
    // (Obsidian can't read them either).
    properties: Document | null
    body: string
}

const parse = (markdown: string): Parsed => {
    const match = FRONTMATTER.exec(markdown)
    if (match === null) return {properties: null, body: markdown}
    const properties = parseDocument(match[1] ?? '')
    const valid = properties.errors.length === 0 && isMap(properties.contents)
    return {properties: valid ? properties : null, body: markdown.slice(match[0].length)}
}

const noteOf = (title: string, markdown: string): Note => {
    const {properties, body} = parse(markdown)
    const values = (properties?.toJS() ?? {}) as Record<string, unknown>
    return {
        title,
        type: textOf(values.type),
        tags: tagsOf(values.tags),
        created: textOf(values.created),
        updated: textOf(values.updated),
        body,
    }
}

// Adapter: each note is <vault>/Elber/Notas/<title>.md, with its type, tags
// and dates as Obsidian properties, which Obsidian shows above the text.
class ObsidianNotes implements NoteStore {
    private readonly folder: string

    constructor(vaultPath: string) {
        this.folder = path.join(vaultPath, NOTES_FOLDER)
    }

    list = async (): Promise<Note[]> => {
        const titles = await this.titles()
        return Promise.all(titles.map(async (title) => noteOf(title, await readFile(this.fileOf(title), 'utf8'))))
    }

    read = async (title: string): Promise<Note | null> => {
        // By listing the folder: the title is matched ignoring case on any
        // disk, and the note keeps the name it already has.
        const existing = (await this.titles()).find((name) => name.toLowerCase() === title.toLowerCase())
        if (existing === undefined) return null
        try {
            return noteOf(existing, await readFile(this.fileOf(existing), 'utf8'))
        } catch (error) {
            if (isMissing(error)) return null
            throw error
        }
    }

    write = async (note: Note) => {
        await mkdir(this.folder, {recursive: true})
        const file = this.fileOf(note.title)
        let properties: Document | null = null
        try {
            properties = parse(await readFile(file, 'utf8')).properties
        } catch (error) {
            if (!isMissing(error)) throw error
        }

        // Only Elber's properties change; the rest stay as the owner left them.
        const fields = {type: note.type, tags: note.tags, created: note.created, updated: note.updated}
        let frontmatter: string
        if (properties === null) {
            frontmatter = stringify(Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null)))
        } else {
            for (const [key, value] of Object.entries(fields)) {
                if (value !== null) properties.set(key, value)
            }
            frontmatter = properties.toString()
        }

        // Through a temporary file and a rename, so Obsidian never sees half a
        // note. Its name starts with a dot: Obsidian doesn't list it.
        const temporary = path.join(this.folder, `.${note.title}${EXTENSION}.tmp`)
        await writeFile(temporary, `---\n${frontmatter}---\n${note.body}`, 'utf8')
        await rename(temporary, file)
    }

    private titles = async (): Promise<string[]> => {
        try {
            const files = await readdir(this.folder)
            return files.filter((file) => file.endsWith(EXTENSION) && !file.startsWith('.')).map((file) => file.slice(0, -EXTENSION.length))
        } catch (error) {
            if (isMissing(error)) return []
            throw error
        }
    }

    private fileOf = (title: string) => path.join(this.folder, `${title}${EXTENSION}`)
}

export default ObsidianNotes
