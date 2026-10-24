import { z } from 'zod'
import { defineTool } from '../../../shared/skills/skill.js'
import type ManageNotesUseCase from '../application/manage-notes.use-case.js'
import { NOTE_TYPES } from '../domain/notes.js'

const title = z.string().trim().min(1).max(100)
const content = z.string().trim().min(1).max(20_000)

// Inbound adapters: what the assistant sees of the owner's notes.
export const buildSaveNoteTool = (notes: ManageNotesUseCase) => defineTool({
    name: 'save_note',
    description: 'Saves one of the user\'s ideas or projects as a note of its own in their vault (Obsidian), '
        + 'to find it again later. Use it when they ask you to save or write something down ("guarda esta idea", '
        + '"anota esto"), or when you develop with them an idea or project worth keeping. '
        + 'Search first with search_notes: if there is already a note about it, extend it with update_note instead. '
        + 'Not for facts about the user (remember) or things to do (add_todo). '
        + 'Write the content as clean Markdown in the user\'s language, as their note, not as a chat transcript. '
        + 'Link related notes with [[Exact title]].',
    input: {
        title: title.describe('Short and descriptive; it is the note\'s name, e.g. "Skill de finanzas".'),
        type: z.enum(NOTE_TYPES).describe(
            'idea: something to think about or try; proyecto: something the user is working on; nota: anything else.',
        ),
        tags: z.array(z.string().trim().min(1).max(40)).max(10).optional().describe(
            'A few topic tags, e.g. ["finanzas", "elber"]. Reuse the ones search_notes shows.',
        ),
        content: content.describe('The note\'s text, in Markdown.'),
    },
    run: ({title, type, tags, content}, {uid}) => notes.save({title, type, tags: tags ?? [], content}, uid),
})

export const buildSearchNotesTool = (notes: ManageNotesUseCase) => defineTool({
    name: 'search_notes',
    description: 'Searches the user\'s notes (ideas, projects...) for words in their title, tags or text, '
        + 'ignoring case and accents; every word must appear. Use it when they ask about something they may have '
        + 'noted, before saving a new note, or to find one to update. Give a few key words, not a sentence. '
        + 'Without a query it lists the most recent notes.',
    input: {
        query: z.string().trim().max(200).optional().describe('Key words, e.g. "finanzas banco".'),
    },
    run: ({query}, {uid}) => notes.search(query ?? '', uid),
})

export const buildReadNoteTool = (notes: ManageNotesUseCase) => defineTool({
    name: 'read_note',
    description: 'Reads one of the user\'s notes in full, with its properties, the notes it links to '
        + '(exists: false if not written yet), the notes that link to it (backlinks: a project\'s ideas...) '
        + 'and its pending tasks (todos: e.g. what is left to do on a project). '
        + 'Use it before answering about a note in detail, or before rewriting it; follow its links when they help.',
    input: {
        title: title.describe('The note\'s title, as search_notes gives it.'),
    },
    run: (input, {uid}) => notes.read(input, uid),
})

export const buildUpdateNoteTool = (notes: ManageNotesUseCase) => defineTool({
    name: 'update_note',
    description: 'Changes one of the user\'s notes. Usually append, to add what is new at the end (an idea that '
        + 'grows, progress on a project). Replace only to rewrite or reorganize the note, giving its whole new '
        + 'text: read it first with read_note so nothing is lost.',
    input: {
        title: title.describe('The note\'s title, as search_notes gives it.'),
        content: content.describe('The text to add (append), or the whole new text (replace), in Markdown.'),
        mode: z.enum(['append', 'replace']).describe('append adds to the end; replace rewrites the text.'),
    },
    run: (input, {uid}) => notes.update(input, uid),
})

export const buildLinkNotesTool = (notes: ManageNotesUseCase) => defineTool({
    name: 'link_notes',
    description: 'Links one of the user\'s notes to another, under a "## Relacionado" section of the first one; '
        + 'Obsidian (and read_note\'s backlinks) shows the link from the other side too. Use it when the user says '
        + 'something goes with something else ("esta idea es para el proyecto X"), or after saving a note that '
        + 'clearly belongs to another (an idea for a project: link the idea to the project). '
        + 'If you only suspect a relation, ask first. Both notes must exist.',
    input: {
        from: title.describe('The note that gets the link, e.g. the idea.'),
        to: title.describe('The note it links to, e.g. the project.'),
    },
    run: (input, {uid}) => notes.link(input, uid),
})
