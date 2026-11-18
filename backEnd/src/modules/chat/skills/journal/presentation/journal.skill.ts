import { z } from 'zod'
import { defineTool } from '../../../domain/skill.js'
import type ManageJournalUseCase from '../application/manage-journal.use-case.js'
import { MONTH } from '../domain/entries.js'

const items = (what: string) => z.array(z.string().trim().min(1).max(60)).max(10).describe(what)

// Inbound adapters: what the diary's agent sees of the journal module.
export const buildSaveEntryTool = (journal: ManageJournalUseCase) => defineTool({
    name: 'save_entry',
    description: 'Saves today\'s diary entry: the one for the day this conversation is about. '
        + 'Call it only after showing the user the draft and getting their OK. '
        + 'Saving again replaces the day\'s entry, so after more talk send the whole updated entry, not only what is new. '
        + 'Write it in the user\'s language.',
    input: {
        summary: z.string().trim().min(1).max(6000).describe(
            'The day in first person, as if the user wrote it, with their words and tone. '
            + 'Only what they told you; a few short paragraphs, no headings.',
        ),
        mood: items('How they felt, e.g. ["contento", "cansado"].'),
        topics: items('What they talked about, e.g. ["trabajo", "familia"].'),
        people: items('The people they mentioned, as they name them, e.g. ["mi mamá", "Ana"]. Empty if none.'),
    },
    run: (input, {uid, conversationId}) => journal.saveEntry(input, conversationId, uid),
})

export const buildReadMonthTool = (journal: ManageJournalUseCase) => defineTool({
    name: 'read_month',
    description: 'Reads every entry of a month of the diary. Use it when the user asks about earlier days, '
        + 'e.g. "¿qué escribí la semana pasada?".',
    input: {
        month: z.string().regex(MONTH).describe('YYYY-MM, e.g. "2026-11".'),
    },
    run: ({month}, {uid}) => journal.readMonth(month, uid),
})

export const buildListMonthsTool = (journal: ManageJournalUseCase) => defineTool({
    name: 'list_months',
    description: 'Lists the months that have diary entries, oldest first.',
    input: {},
    run: (_input, {uid}) => journal.listMonths(uid),
})
