import { addToSection } from './note-lines.js'

// The owner's ideas and projects: one note each, which Elber writes and the
// owner can also edit in Obsidian. The title is the note's name (its file),
// and its properties are what Obsidian shows above it.

export const NOTE_TYPES = ['idea', 'proyecto', 'nota'] as const
export type NoteType = typeof NOTE_TYPES[number]

export interface Note {
    title: string
    // null (or another word) when the owner wrote the note without it.
    type: string | null
    tags: string[]
    // ISO dates (YYYY-MM-DD); null in notes the owner wrote by hand.
    created: string | null
    updated: string | null
    // The Markdown under the properties.
    body: string
}

// What a search gives the model: enough to pick a note and read it.
export interface NoteSummary {
    title: string
    type: string | null
    tags: string[]
    updated: string | null
    excerpt: string
}

// Characters a note's name can't have: they are invalid in file names, or
// break Obsidian's [[links]] to it.
const FORBIDDEN_IN_TITLE = /[\\/:*?"<>|#^[\]]/g
const MAX_TITLE = 100
const EXCERPT = 160

// The title as the note's name, or null when nothing is left of it. Leading
// dots go too: they would hide the file.
export const cleanTitle = (title: string): string | null => {
    const clean = title.replace(FORBIDDEN_IN_TITLE, ' ').replace(/\s+/g, ' ').trim().replace(/^[.\s]+/, '')
    const cut = clean.slice(0, MAX_TITLE).trim()
    return cut === '' ? null : cut
}

// Tags as Obsidian accepts them: no "#" or spaces, letters, digits, "_", "-"
// and "/" (nested tags), and not only digits.
export const cleanTags = (tags: string[]): string[] => {
    const clean = tags
        .map((tag) => tag.trim().replace(/^#+/, '').replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_/-]/gu, '').toLowerCase())
        .filter((tag) => tag !== '' && !/^\d+$/.test(tag))
    return [...new Set(clean)]
}

// Text compared the way a person searches: ignoring case and accents
// ("medico" finds "Médico").
const searchable = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

const wordsOf = (query: string) => searchable(query).split(/\s+/).filter((word) => word !== '')

// A note matches when every word of the query is in its title, tags or text.
const matches = (note: Note, words: string[]) => {
    const text = searchable([note.title, ...note.tags, note.body].join('\n'))
    return words.every((word) => text.includes(word))
}

// A piece of the text around the first word found, or its start.
const excerptOf = (body: string, words: string[]) => {
    const text = body.replace(/\s+/g, ' ').trim()
    const found = words.length === 0 ? -1 : searchable(text).indexOf(words[0])
    const start = Math.max(0, found - EXCERPT / 4)
    const piece = text.slice(start, start + EXCERPT)
    return `${start > 0 ? '…' : ''}${piece}${start + EXCERPT < text.length ? '…' : ''}`
}

// The notes that match the query, most recently updated first (those without
// a date last). An empty query lists the most recent ones.
export const searchNotes = (notes: Note[], query: string, limit: number): NoteSummary[] => {
    const words = wordsOf(query)
    return notes
        .filter((note) => matches(note, words))
        .sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''))
        .slice(0, limit)
        .map((note) => ({
            title: note.title,
            type: note.type,
            tags: note.tags,
            updated: note.updated,
            excerpt: excerptOf(note.body, words),
        }))
}

// Adds text at the end of the note, as a paragraph of its own.
export const appendToBody = (body: string, text: string): string => {
    const start = body.trimEnd()
    return `${start === '' ? '' : `${start}\n\n`}${text.trim()}\n`
}

// A note's place among the others: the notes it links to with [[...]] (the
// ones that don't exist yet too: Obsidian creates them when clicked), and the
// notes that link to it.
export interface NoteLinks {
    links: {title: string, exists: boolean}[]
    backlinks: string[]
}

// [[Target]], [[Target|alias]], [[Target#Heading]], [[Target^block]], and
// embeds (![[Target]]).
const WIKILINK = /\[\[([^\]|#^]+)[^\]]*\]\]/g
// Links to files that aren't notes: images, PDFs...
const OTHER_FILE = /\.(?!md$)[a-z0-9]{2,4}$/i

// The notes the text links to, once each, in the order they appear.
export const linksIn = (body: string): string[] => {
    const titles = new Map<string, string>()
    for (const [, target] of body.matchAll(WIKILINK)) {
        const title = target.trim().replace(/\.md$/i, '')
        if (title !== '' && !OTHER_FILE.test(title) && !titles.has(title.toLowerCase())) titles.set(title.toLowerCase(), title)
    }
    return [...titles.values()]
}

// Links are matched ignoring case, as Obsidian does, and named as the notes
// they point to are.
export const linksOf = (note: Note, notes: Note[]): NoteLinks => {
    const byTitle = new Map(notes.map((other) => [other.title.toLowerCase(), other.title]))
    const self = note.title.toLowerCase()
    return {
        links: linksIn(note.body)
            .filter((title) => title.toLowerCase() !== self)
            .map((title) => {
                const existing = byTitle.get(title.toLowerCase())
                return {title: existing ?? title, exists: existing !== undefined}
            }),
        backlinks: notes
            .filter((other) => other.title.toLowerCase() !== self)
            .filter((other) => linksIn(other.body).some((title) => title.toLowerCase() === self))
            .map((other) => other.title),
    }
}

// Where link_notes files a note's related notes, as Obsidian users often do.
const RELATED_SECTION = 'Relacionado'

// Links the note to another under "## Relacionado". Nothing changes when it
// already links to it, anywhere in the text.
export const addLink = (body: string, title: string): {body: string, changed: boolean} => {
    if (linksIn(body).some((linked) => linked.toLowerCase() === title.toLowerCase())) return {body, changed: false}
    return {body: addToSection(body, RELATED_SECTION, `[[${title}]]`), changed: true}
}
