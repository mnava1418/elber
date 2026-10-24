import env from '../../config/env.js'
import type { Skill } from '../../shared/skills/skill.js'
import EditProfileUseCase from './application/edit-profile.use-case.js'
import GetProfileUseCase from './application/get-profile.use-case.js'
import ObsidianProfileStore from './infrastructure/obsidian-profile-store.js'
import { buildForgetTool, buildProfileContext, buildRememberTool } from './presentation/memory.skill.js'

// Public entry point of the memory skill: what Elber knows about the owner of
// the Obsidian vault. Tools to learn and forget, and the profile it reads
// before every answer.
export type MemoryModule = Skill

const createMemoryModule = (): MemoryModule => {
    // To keep the profile somewhere else, swap this adapter for another ProfileStore.
    const profile = new ObsidianProfileStore(env.OBSIDIAN_VAULT_PATH)
    const editProfile = new EditProfileUseCase(profile, env.MEMORY_OWNER_UID)

    return {
        tools: [buildRememberTool(editProfile), buildForgetTool(editProfile)],
        context: buildProfileContext(new GetProfileUseCase(profile, env.MEMORY_OWNER_UID)),
    }
}

export default createMemoryModule
