import type SendMessageUseCase from '../application/send-message.use-case.js'
import { ConversationNotFoundError } from '../domain/conversation.js'
import type { ChatSocket } from './chat.events.js'
import { isConversationId } from './conversation-id.js'

export const MAX_MESSAGE_LENGTH = 4000

// Inbound adapter: wires one connection's events to the use case.
const buildChatSocketHandler = (sendMessage: SendMessageUseCase) => (socket: ChatSocket) => {
    // The answer in progress, if any.
    let current: AbortController | null = null

    socket.on('chat:message', async (payload) => {
        // Types don't reach the wire: a client can send anything.
        const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
        if (text === '' || text.length > MAX_MESSAGE_LENGTH) {
            socket.emit('chat:error', {code: 'INVALID_MESSAGE', message: `Message must be 1-${MAX_MESSAGE_LENGTH} characters`})
            return
        }
        const conversationId = payload.conversationId
        if (conversationId !== undefined && !isConversationId(conversationId)) {
            socket.emit('chat:error', {code: 'INVALID_MESSAGE', message: 'Invalid conversation id'})
            return
        }
        if (current) {
            socket.emit('chat:error', {code: 'BUSY', message: 'Wait for the current answer to finish'})
            return
        }

        const controller = new AbortController()
        current = controller

        // Everything stays inside try/catch: a rejected listener would be an
        // unhandled rejection.
        try {
            const events = sendMessage.execute({uid: socket.data.user.uid, text, conversationId, signal: controller.signal})
            for await (const event of events) {
                switch (event.type) {
                    case 'conversation':
                        socket.emit('chat:conversation', {id: event.id, title: event.title})
                        break
                    case 'delta':
                        socket.emit('chat:delta', {text: event.text})
                        break
                    case 'tool':
                        socket.emit('chat:tool', {name: event.name, detail: event.detail})
                        break
                    case 'sources':
                        socket.emit('chat:sources', {sources: event.sources})
                        break
                }
            }
            socket.emit('chat:done', {cancelled: controller.signal.aborted})
        } catch (error) {
            if (error instanceof ConversationNotFoundError) {
                socket.emit('chat:error', {code: 'CONVERSATION_NOT_FOUND', message: 'This conversation does not exist'})
            } else if (controller.signal.aborted) {
                socket.emit('chat:done', {cancelled: true})
            } else {
                console.error(`Chat answer failed for ${socket.data.user.uid}:`, error)
                socket.emit('chat:error', {code: 'INTERNAL_ERROR', message: 'Elber could not answer, try again'})
            }
        } finally {
            current = null
        }
    })

    socket.on('chat:cancel', () => current?.abort())

    // Nobody is listening anymore: stop paying for the answer.
    socket.on('disconnect', () => current?.abort())
}

export default buildChatSocketHandler
