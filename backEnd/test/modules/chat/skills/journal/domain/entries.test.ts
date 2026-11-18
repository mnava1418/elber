import { describe, expect, it } from 'vitest'
import { formatEntry, upsertEntry, type Entry } from '../../../../../../src/modules/chat/skills/journal/domain/entries.js'

const ENTRY: Entry = {
    date: '2026-11-02',
    summary: '  Hoy terminé la skill de bugs.\n\nHablé con mi mamá.  ',
    mood: ['contento', 'cansado'],
    topics: ['Elber', 'familia'],
    people: ['mi mamá'],
}

const entry = (date: string, text: string) => `## ${date} (día)\n\n${text}`

describe('formatEntry', () => {
    it('writes the heading, the summary and one line per list', () => {
        expect(formatEntry(ENTRY, 'lunes')).toBe(
            '## 2026-11-02 (lunes)\n\n'
            + 'Hoy terminé la skill de bugs.\n\nHablé con mi mamá.\n\n'
            + '**Ánimo:** contento, cansado\n**Temas:** Elber, familia\n**Personas:** mi mamá',
        )
    })

    it('leaves out empty lists', () => {
        expect(formatEntry({...ENTRY, people: [], topics: []}, 'lunes')).not.toMatch(/Temas|Personas/)
    })
})

describe('upsertEntry', () => {
    it('starts an empty month with the entry', () => {
        expect(upsertEntry('', '2026-11-02', entry('2026-11-02', 'Hoy.'))).toBe(`${entry('2026-11-02', 'Hoy.')}\n`)
    })

    it('inserts the entry in date order', () => {
        const month = `${entry('2026-11-01', 'Uno.')}\n\n${entry('2026-11-03', 'Tres.')}\n`

        expect(upsertEntry(month, '2026-11-02', entry('2026-11-02', 'Dos.'))).toBe(
            `${entry('2026-11-01', 'Uno.')}\n\n${entry('2026-11-02', 'Dos.')}\n\n${entry('2026-11-03', 'Tres.')}\n`,
        )
    })

    it('replaces the day\'s entry, with the headings the owner added inside it', () => {
        const month = `${entry('2026-11-02', 'Antes.\n\n### Mi nota\nAlgo mío.')}\n\n${entry('2026-11-03', 'Tres.')}\n`

        expect(upsertEntry(month, '2026-11-02', entry('2026-11-02', 'Después.'))).toBe(
            `${entry('2026-11-02', 'Después.')}\n\n${entry('2026-11-03', 'Tres.')}\n`,
        )
    })

    it('keeps what the owner wrote before the first entry', () => {
        const month = `# Noviembre\n\n${entry('2026-11-03', 'Tres.')}\n`

        expect(upsertEntry(month, '2026-11-02', entry('2026-11-02', 'Dos.'))).toBe(
            `# Noviembre\n\n${entry('2026-11-02', 'Dos.')}\n\n${entry('2026-11-03', 'Tres.')}\n`,
        )
    })
})
