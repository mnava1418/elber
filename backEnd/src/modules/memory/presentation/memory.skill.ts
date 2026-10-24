import { z } from 'zod'
import { defineTool } from '../../../shared/skills/skill.js'
import type EditProfileUseCase from '../application/edit-profile.use-case.js'
import type GetProfileUseCase from '../application/get-profile.use-case.js'

const fact = z.string().trim().min(1).max(300)

// Inbound adapters: what the assistant sees of the memory module.
export const buildRememberTool = (editProfile: EditProfileUseCase) => defineTool({
    name: 'remember',
    description: 'Saves a lasting fact about the user in their profile, which you get at the start of every conversation. '
        + 'Use it when the user asks you to remember something, or when they tell you something about themselves '
        + 'worth knowing next time: who they are, what they like or dislike, their projects, the people in their life. '
        + 'Not for passing states ("I\'m tired today"), for what is already in the profile, or for things '
        + 'they have to do ("recuérdame llamar a mi mamá" is a task: use add_todo). '
        + 'One short fact per call, in the user\'s language, written as a note about them, e.g. "Vive en CDMX".',
    input: {
        section: z.string().trim().min(1).max(60).describe(
            'Profile section, e.g. "Sobre mí", "Gustos" or "Proyectos". Prefer one that already exists; '
            + 'a new one is created if none fits.',
        ),
        fact: fact.describe('The fact, on one line.'),
    },
    run: (input, {uid}) => editProfile.remember(input, uid),
})

export const buildForgetTool = (editProfile: EditProfileUseCase) => defineTool({
    name: 'forget',
    description: 'Removes a fact from the user\'s profile. Use it when the user asks you to forget something, '
        + 'or when a fact is no longer true (then remember the new one).',
    input: {
        fact: fact.describe('The fact exactly as it appears in the profile.'),
    },
    run: (input, {uid}) => editProfile.forget(input, uid),
})

// What Elber reads about the owner before every answer, in its system prompt.
export const buildProfileContext = (getProfile: GetProfileUseCase) => async (uid: string): Promise<string | null> => {
    const profile = await getProfile.execute(uid)
    if (profile === null) return null
    return 'What you know about the user, from their profile (they can also edit it themselves). '
        + 'Use it when it helps, naturally: don\'t recite it. Keep it current with remember and forget.\n\n'
        + `<profile>\n${profile}\n</profile>`
}
