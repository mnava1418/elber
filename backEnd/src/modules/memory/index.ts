import env from '../../config/env.js'
import type { Skill } from '../../shared/skills/skill.js'
import EditProfileUseCase from './application/edit-profile.use-case.js'
import GetProfileUseCase from './application/get-profile.use-case.js'
import ManageTodosUseCase from './application/manage-todos.use-case.js'
import ObsidianNoteFile from './infrastructure/obsidian-note-file.js'
import { buildForgetTool, buildProfileContext, buildRememberTool } from './presentation/memory.skill.js'
import { buildAddTodoTool, buildCompleteTodoTool, buildListTodosTool } from './presentation/todos.skill.js'

// Public entry point of the memory skill: what Elber knows about the owner of
// the Obsidian vault. Tools to learn and forget, the profile it reads before
// every answer, and the owner's to-do list.
export type MemoryModule = Skill

const createMemoryModule = (): MemoryModule => {
    // To keep the notes somewhere else, swap this adapter for another NoteFile.
    const profile = new ObsidianNoteFile(env.OBSIDIAN_VAULT_PATH, 'Perfil.md')
    const editProfile = new EditProfileUseCase(profile, env.MEMORY_OWNER_UID)
    const todos = new ManageTodosUseCase(new ObsidianNoteFile(env.OBSIDIAN_VAULT_PATH, 'Pendientes.md'), env.MEMORY_OWNER_UID)

    return {
        tools: [
            buildRememberTool(editProfile),
            buildForgetTool(editProfile),
            buildAddTodoTool(todos),
            buildCompleteTodoTool(todos),
            buildListTodosTool(todos),
        ],
        context: buildProfileContext(new GetProfileUseCase(profile, env.MEMORY_OWNER_UID)),
    }
}

export default createMemoryModule
