import type { Assistant } from '../domain/assistant.port.js'
import type { ChatSocket } from './chat.events.js'

export const MAX_MESSAGE_LENGTH = 4000

// Inbound adapter: wires one connection's events to the assistant.
const buildChatSocketHandler = (assistant: Assistant) => (socket: ChatSocket) => {
    // The answer in progress, if any.
    let current: AbortController | null = null
    // The conversation: each message continues it, until chat:reset. It lives
    // as long as the connection (a new connection starts a new one).
    let sessionId: string | undefined
    // Changes on chat:reset, so an answer still ending can't bring back the old conversation.
    let conversation = 0

    socket.on('chat:message', async (payload) => {
        // Types don't reach the wire: a client can send anything.
        const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
        if (text === '' || text.length > MAX_MESSAGE_LENGTH) {
            socket.emit('chat:error', {code: 'INVALID_MESSAGE', message: `Message must be 1-${MAX_MESSAGE_LENGTH} characters`})
            return
        }
        if (current) {
            socket.emit('chat:error', {code: 'BUSY', message: 'Wait for the current answer to finish'})
            return
        }

        const controller = new AbortController()
        current = controller
        const startedIn = conversation

        // Everything stays inside try/catch: a rejected listener would be an
        // unhandled rejection.
        try {
            for await (const event of assistant.reply({text, signal: controller.signal, sessionId})) {
                switch (event.type) {
                    case 'delta':
                        socket.emit('chat:delta', {text: event.text})
                        break
                    case 'tool':
                        socket.emit('chat:tool', {name: event.name, detail: event.detail})
                        break
                    case 'sources':
                        socket.emit('chat:sources', {sources: event.sources})
                        break
                    case 'session':
                        if (conversation === startedIn) sessionId = event.id
                        break
                }
            }
            socket.emit('chat:done', {cancelled: controller.signal.aborted})
        } catch (error) {
            if (controller.signal.aborted) {
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

    socket.on('chat:reset', () => {
        current?.abort()
        sessionId = undefined
        conversation++
    })

    // Nobody is listening anymore: stop paying for the answer.
    socket.on('disconnect', () => current?.abort())
}

export default buildChatSocketHandler
