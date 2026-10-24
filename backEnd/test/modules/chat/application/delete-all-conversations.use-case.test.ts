import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteAllConversationsUseCase from '../../../../src/modules/chat/application/delete-all-conversations.use-case.js'
import type { Assistant } from '../../../../src/modules/chat/domain/assistant.port.js'
import InMemoryConversations from '../in-memory-conversations.js'

describe('DeleteAllConversationsUseCase', () => {
    const forget = vi.fn<Assistant['forget']>()
    const assistant: Assistant = {forget, reply: () => { throw new Error('unused') }}
    let repository: InMemoryConversations
    let useCase: DeleteAllConversationsUseCase

    beforeEach(() => {
        vi.restoreAllMocks()
        forget.mockReset().mockResolvedValue()
        repository = new InMemoryConversations()
        useCase = new DeleteAllConversationsUseCase(repository, assistant)
    })

    it("deletes every conversation of the user and the assistant's memory of them", async () => {
        const first = await repository.create('uid-1', {title: 'Una'})
        const second = await repository.create('uid-1', {title: 'Otra'})
        await repository.create('uid-1', {title: 'Sin respuesta'})
        await repository.setAssistantSession('uid-1', first.id, 'session-1')
        await repository.setAssistantSession('uid-1', second.id, 'session-2')

        await useCase.execute({uid: 'uid-1'})

        expect(repository.conversations.size).toBe(0)
        expect(forget.mock.calls).toEqual([['session-1'], ['session-2']])
    })

    it("keeps everyone else's conversations", async () => {
        const {id} = await repository.create('someone-else', {title: 'Suya'})
        await repository.setAssistantSession('someone-else', id, 'session-1')
        await repository.create('uid-1', {title: 'Mía'})

        await useCase.execute({uid: 'uid-1'})

        expect([...repository.conversations.keys()]).toEqual([id])
        expect(forget).not.toHaveBeenCalled()
    })

    it('forgets the other sessions when one cannot be deleted', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        forget.mockRejectedValueOnce(new Error('disk error'))
        const first = await repository.create('uid-1', {title: 'Una'})
        const second = await repository.create('uid-1', {title: 'Otra'})
        await repository.setAssistantSession('uid-1', first.id, 'session-1')
        await repository.setAssistantSession('uid-1', second.id, 'session-2')

        await expect(useCase.execute({uid: 'uid-1'})).resolves.toBeUndefined()

        expect(repository.conversations.size).toBe(0)
        expect(forget).toHaveBeenCalledTimes(2)
        expect(error).toHaveBeenCalledOnce()
    })

    it('does nothing without conversations', async () => {
        await useCase.execute({uid: 'uid-1'})

        expect(forget).not.toHaveBeenCalled()
    })
})
