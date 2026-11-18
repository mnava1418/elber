import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { SkillContext } from '../../../../src/modules/chat/domain/skill.js'
import type EditProfileUseCase from '../../../../src/modules/memory/application/edit-profile.use-case.js'
import type GetProfileUseCase from '../../../../src/modules/memory/application/get-profile.use-case.js'
import { buildForgetTool, buildProfileContext, buildRememberTool } from '../../../../src/modules/memory/presentation/memory.skill.js'

const context: SkillContext = {
    uid: 'owner-uid',
    conversationId: 'conv1',
    signal: new AbortController().signal,
    locate: async () => null,
    show: () => {},
}

const editProfile = () => ({
    remember: vi.fn<EditProfileUseCase['remember']>(async () => ({remembered: true})),
    forget: vi.fn<EditProfileUseCase['forget']>(async () => ({forgotten: true})),
})

describe('remember tool', () => {
    it("remembers the fact for the user asking and gives the result to the model", async () => {
        const useCase = editProfile()
        const tool = buildRememberTool(useCase as unknown as EditProfileUseCase)

        const result = await tool.run({section: 'Gustos', fact: 'El café'}, context)

        expect(useCase.remember).toHaveBeenCalledExactlyOnceWith({section: 'Gustos', fact: 'El café'}, 'owner-uid')
        expect(result).toEqual({remembered: true})
    })

    it('rejects a blank fact before it reaches the profile', () => {
        const input = z.object(buildRememberTool(editProfile() as unknown as EditProfileUseCase).input)

        expect(input.safeParse({section: 'Gustos', fact: '   '}).success).toBe(false)
        expect(input.parse({section: ' Gustos ', fact: ' El café '})).toEqual({section: 'Gustos', fact: 'El café'})
    })
})

describe('forget tool', () => {
    it('forgets the fact for the user asking and gives the result to the model', async () => {
        const useCase = editProfile()
        const tool = buildForgetTool(useCase as unknown as EditProfileUseCase)

        const result = await tool.run({fact: 'El café'}, context)

        expect(useCase.forget).toHaveBeenCalledExactlyOnceWith({fact: 'El café'}, 'owner-uid')
        expect(result).toEqual({forgotten: true})
    })
})

describe('profile context', () => {
    const contextWith = (profile: string | null) =>
        buildProfileContext({execute: async () => profile} as unknown as GetProfileUseCase)

    it('gives the model the profile, marked off from the rest of the prompt', async () => {
        const context = await contextWith('## Gustos\n- El café')('owner-uid')

        expect(context).toContain('<profile>\n## Gustos\n- El café\n</profile>')
    })

    it('adds nothing to the prompt without a profile', async () => {
        expect(await contextWith(null)('friend-uid')).toBeNull()
    })
})
