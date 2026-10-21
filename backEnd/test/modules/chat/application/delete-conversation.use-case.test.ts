import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteConversationUseCase from '../../../../src/modules/chat/application/delete-conversation.use-case.js'
import type { Assistant } from '../../../../src/modules/chat/domain/assistant.port.js'
import { ConversationNotFoundError } from '../../../../src/modules/chat/domain/conversation.js'
import InMemoryConversations from '../in-memory-conversations.js'

describe('DeleteConversationUseCase', () => {
    const forget = vi.fn<Assistant['forget']>()
    const assistant: Assistant = {forget, reply: () => { throw new Error('unused') }}
    let repository: InMemoryConversations
    let useCase: DeleteConversationUseCase

    beforeEach(() => {
        vi.restoreAllMocks()
        forget.mockReset().mockResolvedValue()
        repository = new InMemoryConversations()
        useCase = new DeleteConversationUseCase(repository, assistant)
    })

    it('deletes the conversation and the assistant\'s memory of it', async () => {
        const {id} = await repository.create('uid-1', {title: 'Hola'})
        await repository.setAssistantSession('uid-1', id, 'session-1')

        await useCase.execute({uid: 'uid-1', conversationId: id})

        expect(repository.conversations.has(id)).toBe(false)
        expect(forget).toHaveBeenCalledExactlyOnceWith('session-1')
    })

    it('has nothing to forget when the assistant never answered', async () => {
        const {id} = await repository.create('uid-1', {title: 'Hola'})

        await useCase.execute({uid: 'uid-1', conversationId: id})

        expect(repository.conversations.has(id)).toBe(false)
        expect(forget).not.toHaveBeenCalled()
    })

    it('still deletes the conversation when its memory cannot be deleted', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        forget.mockRejectedValue(new Error('disk error'))
        const {id} = await repository.create('uid-1', {title: 'Hola'})
        await repository.setAssistantSession('uid-1', id, 'session-1')

        await expect(useCase.execute({uid: 'uid-1', conversationId: id})).resolves.toBeUndefined()

        expect(repository.conversations.has(id)).toBe(false)
        expect(error).toHaveBeenCalledOnce()
    })

    it('throws ConversationNotFoundError for someone else\'s conversation, touching nothing', async () => {
        const {id} = await repository.create('someone-else', {title: 'Suya'})
        await repository.setAssistantSession('someone-else', id, 'session-1')

        await expect(useCase.execute({uid: 'uid-1', conversationId: id})).rejects.toThrow(ConversationNotFoundError)

        expect(repository.conversations.has(id)).toBe(true)
        expect(forget).not.toHaveBeenCalled()
    })
})
