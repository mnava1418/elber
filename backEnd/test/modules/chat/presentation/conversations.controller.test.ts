import { AddressInfo } from 'node:net'
import { Server } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import DeleteConversationUseCase from '../../../../src/modules/chat/application/delete-conversation.use-case.js'
import GetConversationUseCase from '../../../../src/modules/chat/application/get-conversation.use-case.js'
import ListConversationsUseCase from '../../../../src/modules/chat/application/list-conversations.use-case.js'
import buildChatRoutes from '../../../../src/modules/chat/presentation/chat.routes.js'
import ConversationsController, { MAX_PAGE_SIZE } from '../../../../src/modules/chat/presentation/conversations.controller.js'
import type { TokenVerifier } from '../../../../src/shared/auth/token-verifier.js'
import { buildRequireAuth } from '../../../../src/shared/http/middlewares/auth.middleware.js'
import errorHandler from '../../../../src/shared/http/middlewares/error.middleware.js'
import InMemoryConversations from '../in-memory-conversations.js'

// Routes, auth and status codes through a real Express app on a random local
// port, with the real use cases over conversations in memory. Each token is
// the uid it belongs to ('uid-1' signs in as uid-1); 'boom' breaks Firebase.
const verify: TokenVerifier = async (token) => {
    if (token === 'boom') throw new Error('firebase down')
    return token.startsWith('uid-') ? {uid: token} : null
}

const NOT_FOUND = {status: 404, body: {error: {code: 'CONVERSATION_NOT_FOUND', message: 'This conversation does not exist'}}}

describe('chat conversations routes', () => {
    let server: Server
    let url: string
    let repository: InMemoryConversations

    beforeEach(async () => {
        vi.restoreAllMocks()
        repository = new InMemoryConversations()
        const controller = new ConversationsController(
            new ListConversationsUseCase(repository),
            new GetConversationUseCase(repository),
            new DeleteConversationUseCase(repository),
        )
        const app = express()
        app.use('/chat', buildChatRoutes(buildRequireAuth(verify), controller))
        app.use(errorHandler)

        server = app.listen(0)
        await new Promise((resolve) => server.once('listening', resolve))
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/chat`
    })

    afterEach(() => {
        server.close()
    })

    const request = async (method: string, path: string, token: string | null = 'uid-1') => {
        const headers: Record<string, string> = token ? {Authorization: `Bearer ${token}`} : {}
        const response = await fetch(`${url}${path}`, {method, headers})
        const text = await response.text()
        return {status: response.status, body: text ? JSON.parse(text) : null}
    }

    // Conversations of the user titled after the given names, created in
    // order (the last one is the most recently updated).
    const conversationsOf = async (uid: string, ...titles: string[]) => {
        const ids = []
        for (const title of titles) ids.push((await repository.create(uid, {title})).id)
        return ids
    }

    describe('auth', () => {
        it.each([
            ['no token', null, 'Missing auth token'],
            ['an invalid token', 'not-a-user', 'Invalid auth token'],
        ])('answers 401 with %s', async (_case, token, message) => {
            const response = await request('GET', '/conversations', token)

            expect(response).toEqual({status: 401, body: {error: {code: 'UNAUTHORIZED', message}}})
        })

        it('answers a generic 500 when the token cannot be checked', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {})

            const response = await request('GET', '/conversations', 'boom')

            expect(response).toEqual({status: 500, body: {error: {code: 'INTERNAL_ERROR', message: 'Internal server error'}}})
        })
    })

    describe('GET /conversations', () => {
        it('lists only the user\'s conversations, most recently updated first', async () => {
            const [first, second] = await conversationsOf('uid-1', 'Primera', 'Segunda')
            await conversationsOf('someone-else', 'Ajena')
            // A new message moves the first one to the top.
            await repository.addMessage('uid-1', first, {role: 'user', text: 'hola'})

            const response = await request('GET', '/conversations')

            expect(response.status).toBe(200)
            expect(response.body.conversations.map((c: {id: string}) => c.id)).toEqual([first, second])
            expect(response.body.conversations[0]).toEqual({
                id: first, title: 'Primera', createdAt: expect.any(String), updatedAt: expect.any(String),
            })
            expect(response.body.nextCursor).toBeNull()
        })

        it('pages with limit and cursor', async () => {
            const ids = await conversationsOf('uid-1', 'a', 'b', 'c')

            const page1 = await request('GET', '/conversations?limit=2')
            const page2 = await request('GET', `/conversations?limit=2&cursor=${page1.body.nextCursor}`)

            expect(page1.body.conversations.map((c: {id: string}) => c.id)).toEqual([ids[2], ids[1]])
            expect(page1.body.nextCursor).toEqual(expect.any(String))
            expect(page2.body.conversations.map((c: {id: string}) => c.id)).toEqual([ids[0]])
            expect(page2.body.nextCursor).toBeNull()
        })

        it.each([
            ['limit=0'], ['limit=abc'], ['limit=1.5'], [`limit=${MAX_PAGE_SIZE + 1}`], ['cursor='],
        ])('answers 400 INVALID_QUERY for %s', async (query) => {
            const response = await request('GET', `/conversations?${query}`)

            expect(response.status).toBe(400)
            expect(response.body.error.code).toBe('INVALID_QUERY')
        })

        it('answers 400 INVALID_CURSOR for a cursor it did not give', async () => {
            const response = await request('GET', '/conversations?cursor=made-up')

            expect(response).toEqual({status: 400, body: {error: {code: 'INVALID_CURSOR', message: 'Invalid cursor'}}})
        })
    })

    describe('GET /conversations/:id', () => {
        it('answers the conversation with its messages, oldest first', async () => {
            const [id] = await conversationsOf('uid-1', '¿Qué clima hace?')
            await repository.setAssistantSession('uid-1', id, 'session-1')
            await repository.addMessage('uid-1', id, {role: 'user', text: '¿Qué clima hace?'})
            await repository.addMessage('uid-1', id, {role: 'elber', text: 'Sol', status: 'done', sources: [], tools: []})

            const response = await request('GET', `/conversations/${id}`)

            // The assistant session never leaves the backend.
            expect(response).toEqual({status: 200, body: {
                id,
                title: '¿Qué clima hace?',
                messages: [
                    {id: 'm1', role: 'user', text: '¿Qué clima hace?', createdAt: expect.any(String)},
                    {id: 'm2', role: 'elber', text: 'Sol', status: 'done', sources: [], tools: [], createdAt: expect.any(String)},
                ],
            }})
        })

        it.each([
            ['someone else\'s', 'conv1'],
            ['a missing', 'conv9'],
            ['an impossible', 'not-an-id!'],
        ])('answers 404 for %s conversation', async (_case, id) => {
            await conversationsOf('someone-else', 'Ajena')

            expect(await request('GET', `/conversations/${id}`)).toEqual(NOT_FOUND)
        })
    })

    describe('DELETE /conversations/:id', () => {
        it('deletes the conversation and answers 204', async () => {
            const [id] = await conversationsOf('uid-1', 'Borrar')

            const response = await request('DELETE', `/conversations/${id}`)

            expect(response).toEqual({status: 204, body: null})
            expect(repository.conversations.has(id)).toBe(false)
        })

        it('answers 404 and keeps someone else\'s conversation', async () => {
            const [id] = await conversationsOf('someone-else', 'Ajena')

            expect(await request('DELETE', `/conversations/${id}`)).toEqual(NOT_FOUND)
            expect(repository.conversations.has(id)).toBe(true)
        })
    })
})
