import env from '../../config/env.js'
import type { Skill } from '../../shared/skills/skill.js'
import EditProfileUseCase from './application/edit-profile.use-case.js'
import GetProfileUseCase from './application/get-profile.use-case.js'
import ManageNotesUseCase from './application/manage-notes.use-case.js'
import ManageTodosUseCase from './application/manage-todos.use-case.js'
import ObsidianNoteFile from './infrastructure/obsidian-note-file.js'
import ObsidianNotes from './infrastructure/obsidian-notes.js'
import { buildForgetTool, buildProfileContext, buildRememberTool } from './presentation/memory.skill.js'
import { buildReadNoteTool, buildSaveNoteTool, buildSearchNotesTool, buildUpdateNoteTool } from './presentation/notes.skill.js'
import { buildAddTodoTool, buildCompleteTodoTool, buildListTodosTool } from './presentation/todos.skill.js'

// Public entry point of the memory skill: what Elber knows about the owner of
// the Obsidian vault. Tools to learn and forget, the profile it reads before
// every answer, the owner's to-do list, and their notes (ideas, projects...).
export type MemoryModule = Skill

const createMemoryModule = (): MemoryModule => {
    // To keep the notes somewhere else, swap this adapter for another NoteFile.
    const profile = new ObsidianNoteFile(env.OBSIDIAN_VAULT_PATH, 'Perfil.md')
    const editProfile = new EditProfileUseCase(profile, env.MEMORY_OWNER_UID)
    const todos = new ManageTodosUseCase(new ObsidianNoteFile(env.OBSIDIAN_VAULT_PATH, 'Pendientes.md'), env.MEMORY_OWNER_UID)
    const notes = new ManageNotesUseCase(new ObsidianNotes(env.OBSIDIAN_VAULT_PATH), env.MEMORY_OWNER_UID)

    return {
        tools: [
            buildRememberTool(editProfile),
            buildForgetTool(editProfile),
            buildAddTodoTool(todos),
            buildCompleteTodoTool(todos),
            buildListTodosTool(todos),
            buildSaveNoteTool(notes),
            buildSearchNotesTool(notes),
            buildReadNoteTool(notes),
            buildUpdateNoteTool(notes),
        ],
        context: buildProfileContext(new GetProfileUseCase(profile, env.MEMORY_OWNER_UID)),
    }
}

export default createMemoryModule
