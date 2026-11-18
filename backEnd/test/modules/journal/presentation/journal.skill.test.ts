import { describe, expect, it, vi } from 'vitest'
import type ManageJournalUseCase from '../../../../src/modules/journal/application/manage-journal.use-case.js'
import { buildSaveEntryTool } from '../../../../src/modules/journal/presentation/journal.skill.js'
import type { SkillContext } from '../../../../src/modules/chat/domain/skill.js'

const context: SkillContext = {
    uid: 'owner-uid',
    conversationId: '2026-11-02',
    signal: new AbortController().signal,
    locate: async () => null,
    show: () => {},
}

describe('save_entry tool', () => {
    it('saves the entry in the conversation\'s day, not one the model picks', async () => {
        const saveEntry = vi.fn(async () => ({saved: true as const, date: '2026-11-02'}))
        const tool = buildSaveEntryTool({saveEntry} as unknown as ManageJournalUseCase)
        const input = {summary: 'Hoy.', mood: [], topics: [], people: []}

        expect(await tool.run(input, context)).toEqual({saved: true, date: '2026-11-02'})
        expect(saveEntry).toHaveBeenCalledExactlyOnceWith(input, '2026-11-02', 'owner-uid')
    })
})
