import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ObsidianJournal from '../../../../../../src/modules/chat/skills/journal/infrastructure/obsidian-journal.js'

// A real, empty vault in tmp: the adapter is only file reads and writes.
describe('ObsidianJournal', () => {
    let vault: string
    let journal: ObsidianJournal

    beforeEach(async () => {
        vault = await mkdtemp(path.join(tmpdir(), 'elber-vault-'))
        journal = new ObsidianJournal(vault)
    })

    afterEach(async () => {
        await rm(vault, {recursive: true, force: true})
    })

    it('has no months before the first entry', async () => {
        expect(await journal.readMonth('2026-11')).toBe('')
        expect(await journal.listMonths()).toEqual([])
    })

    it('writes each month in Elber/Diario/, without leftovers', async () => {
        await journal.writeMonth('2026-11', '## 2026-11-02 (lunes)\n\nHoy.\n')

        expect(await readFile(path.join(vault, 'Elber', 'Diario', '2026-11.md'), 'utf8')).toBe('## 2026-11-02 (lunes)\n\nHoy.\n')
        expect(await readdir(path.join(vault, 'Elber', 'Diario'))).toEqual(['2026-11.md'])
        expect(await journal.readMonth('2026-11')).toBe('## 2026-11-02 (lunes)\n\nHoy.\n')
    })

    it('lists only the months, oldest first', async () => {
        await journal.writeMonth('2026-11', 'Noviembre')
        await journal.writeMonth('2026-10', 'Octubre')
        await mkdir(path.join(vault, 'Elber', 'Diario'), {recursive: true})
        await writeFile(path.join(vault, 'Elber', 'Diario', 'Ideas.md'), 'Del dueño')

        expect(await journal.listMonths()).toEqual(['2026-10', '2026-11'])
    })

    it('refuses a month that could leave the folder', async () => {
        await expect(journal.readMonth('../Elber/Perfil')).rejects.toThrow('Invalid diary month')
        await expect(journal.writeMonth('../x', 'x')).rejects.toThrow('Invalid diary month')
    })
})
