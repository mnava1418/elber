import env from '../../../../config/env.js'
import type { Skill } from '../../domain/skill.js'
import EditProfileUseCase from './application/edit-profile.use-case.js'
import GetProfileUseCase from './application/get-profile.use-case.js'
import ManageNotesUseCase from './application/manage-notes.use-case.js'
import ManageTodosUseCase from './application/manage-todos.use-case.js'
import ObsidianNoteFile from './infrastructure/obsidian-note-file.js'
import ObsidianNotes from './infrastructure/obsidian-notes.js'
import { buildForgetTool, buildProfileContext, buildRememberTool } from './presentation/memory.skill.js'
import { buildLinkNotesTool, buildReadNoteTool, buildSaveNoteTool, buildSearchNotesTool, buildUpdateNoteTool } from './presentation/notes.skill.js'
import { buildAddTodoTool, buildCompleteTodoTool, buildListTodosTool } from './presentation/todos.skill.js'

// Public entry point of the memory skill (only the chat's index.ts imports
// it): what Elber knows about the owner of
// the Obsidian vault. Tools to learn and forget, the profile it reads before
// every answer, the owner's to-do list, and their notes (ideas, projects...).
export interface MemorySkills {
    // All of it, for the chat.
    skill: Skill
    // Only the profile and the tools to change it, for the diary: it gets to
    // know the user, but not their notes or to-dos.
    profile: Skill
}

const createMemorySkills = (): MemorySkills => {
    // To keep the notes somewhere else, swap this adapter for another NoteFile.
    const profile = new ObsidianNoteFile(env.OBSIDIAN_VAULT_PATH, 'Perfil.md')
    const editProfile = new EditProfileUseCase(profile, env.MEMORY_OWNER_UID)
    // To-dos can belong to a note (a project), and a note shows its to-dos.
    const todoList = new ObsidianNoteFile(env.OBSIDIAN_VAULT_PATH, 'Pendientes.md')
    const noteStore = new ObsidianNotes(env.OBSIDIAN_VAULT_PATH)
    const todos = new ManageTodosUseCase(todoList, noteStore, env.MEMORY_OWNER_UID)
    const notes = new ManageNotesUseCase(noteStore, todoList, env.MEMORY_OWNER_UID)

    const remember = buildRememberTool(editProfile)
    const forget = buildForgetTool(editProfile)
    const profileContext = buildProfileContext(new GetProfileUseCase(profile, env.MEMORY_OWNER_UID))

    return {
        skill: {
            tools: [
                remember,
                forget,
                buildAddTodoTool(todos),
                buildCompleteTodoTool(todos),
                buildListTodosTool(todos),
                buildSaveNoteTool(notes),
                buildSearchNotesTool(notes),
                buildReadNoteTool(notes),
                buildUpdateNoteTool(notes),
                buildLinkNotesTool(notes),
            ],
            context: profileContext,
        },
        profile: {tools: [remember, forget], context: profileContext},
    }
}

export default createMemorySkills
