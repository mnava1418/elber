import env from '../../config/env.js'
import type { Skill } from '../chat/domain/skill.js'
import ManageJournalUseCase from './application/manage-journal.use-case.js'
import ObsidianJournal from './infrastructure/obsidian-journal.js'
import { buildListMonthsTool, buildReadMonthTool, buildSaveEntryTool } from './presentation/journal.skill.js'

export { DIARY_SYSTEM_PROMPT } from './presentation/diary-system-prompt.js'

// Public entry point of the journal skill: the owner's diary, a summary per
// day in Elber/Diario/ of the vault. Only the diary's section gets these tools.
export type JournalModule = Skill

const createJournalModule = (): JournalModule => {
    // To keep the diary somewhere else, swap this adapter for another JournalStore.
    const journal = new ManageJournalUseCase(new ObsidianJournal(env.OBSIDIAN_VAULT_PATH), env.MEMORY_OWNER_UID)

    return {
        tools: [buildSaveEntryTool(journal), buildReadMonthTool(journal), buildListMonthsTool(journal)],
    }
}

export default createJournalModule
