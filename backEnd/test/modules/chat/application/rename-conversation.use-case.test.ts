import { beforeEach, describe, expect, it } from 'vitest'
import RenameConversationUseCase from '../../../../src/modules/chat/application/rename-conversation.use-case.js'
import { ConversationNotFoundError } from '../../../../src/modules/chat/domain/conversation.js'
import InMemoryConversations from '../in-memory-conversations.js'

describe('RenameConversationUseCase', () => {
    let repository: InMemoryConversations
    let useCase: RenameConversationUseCase

    beforeEach(() => {
        repository = new InMemoryConversations()
        useCase = new RenameConversationUseCase(repository)
    })

    it('renames the conversation', async () => {
        const {id} = await repository.create('uid-1', {title: 'oye qué clima hace'})

        expect(await useCase.execute({uid: 'uid-1', conversationId: id, title: 'Clima'})).toEqual({id, title: 'Clima'})
        expect(repository.conversations.get(id)?.title).toBe('Clima')
    })

    it("throws ConversationNotFoundError for someone else's conversation, touching nothing", async () => {
        const {id} = await repository.create('someone-else', {title: 'Suya'})

        await expect(useCase.execute({uid: 'uid-1', conversationId: id, title: 'Mía'})).rejects.toThrow(ConversationNotFoundError)
        expect(repository.conversations.get(id)?.title).toBe('Suya')
    })
})
