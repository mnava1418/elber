import { beforeEach, describe, expect, it } from 'vitest'
import ManageJournalUseCase from '../../../../src/modules/journal/application/manage-journal.use-case.js'
import type { JournalStore } from '../../../../src/modules/journal/domain/journal-store.port.js'

const OWNER = 'owner-uid'
const ENTRY = {summary: 'Hoy terminé la skill de bugs.', mood: ['contento'], topics: ['Elber'], people: []}

// Months in memory. Reads and writes wait a tick, like real files do, so
// saves at the same time interleave unless they are queued.
const fakeStore = () => {
    const months = new Map<string, string>()
    const store: JournalStore = {
        readMonth: async (month) => {
            await Promise.resolve()
            return months.get(month) ?? ''
        },
        writeMonth: async (month, text) => {
            await Promise.resolve()
            months.set(month, text)
        },
        listMonths: async () => [...months.keys()].sort(),
    }
    return {store, months}
}

describe('ManageJournalUseCase', () => {
    let vault: ReturnType<typeof fakeStore>
    let journal: ManageJournalUseCase

    beforeEach(() => {
        vault = fakeStore()
        journal = new ManageJournalUseCase(vault.store, OWNER)
    })

    it('saves the entry in its month, with the weekday in the heading', async () => {
        expect(await journal.saveEntry(ENTRY, '2026-11-02', OWNER)).toEqual({saved: true, date: '2026-11-02'})

        expect(vault.months.get('2026-11')).toBe('## 2026-11-02 (lunes)\n\nHoy terminé la skill de bugs.\n\n**Ánimo:** contento\n**Temas:** Elber\n')
    })

    it('replaces the day\'s entry when saved again', async () => {
        await journal.saveEntry(ENTRY, '2026-11-02', OWNER)
        await journal.saveEntry({...ENTRY, summary: 'Y en la noche salí a correr.'}, '2026-11-02', OWNER)

        const month = vault.months.get('2026-11')!
        expect(month.match(/## 2026-11-02/g)).toHaveLength(1)
        expect(month).toContain('salí a correr')
    })

    it('keeps both entries when two days are saved at the same time', async () => {
        await Promise.all([
            journal.saveEntry(ENTRY, '2026-11-02', OWNER),
            journal.saveEntry(ENTRY, '2026-11-03', OWNER),
        ])

        expect(vault.months.get('2026-11')).toMatch(/2026-11-02[\s\S]*2026-11-03/)
    })

    it('saves nothing when the conversation is not a diary day', async () => {
        expect(await journal.saveEntry(ENTRY, 'conv1', OWNER)).toEqual({error: 'NOT_A_DIARY_DAY'})
        expect(vault.months.size).toBe(0)
    })

    it('reads a month, or says it has no entries', async () => {
        await journal.saveEntry(ENTRY, '2026-11-02', OWNER)

        expect(await journal.readMonth('2026-11', OWNER)).toMatchObject({month: '2026-11', entries: expect.stringContaining('## 2026-11-02')})
        expect(await journal.readMonth('2026-10', OWNER)).toEqual({error: 'NO_ENTRIES', month: '2026-10'})
    })

    it('lists the months', async () => {
        await journal.saveEntry(ENTRY, '2026-11-02', OWNER)

        expect(await journal.listMonths(OWNER)).toEqual({months: ['2026-11']})
    })

    it('gives no diary to anyone else', async () => {
        expect(await journal.saveEntry(ENTRY, '2026-11-02', 'someone-else')).toEqual({error: 'JOURNAL_UNAVAILABLE'})
        expect(await journal.readMonth('2026-11', 'someone-else')).toEqual({error: 'JOURNAL_UNAVAILABLE'})
        expect(await journal.listMonths('someone-else')).toEqual({error: 'JOURNAL_UNAVAILABLE'})
        expect(vault.months.size).toBe(0)
    })
})
