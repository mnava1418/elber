import { RequestHandler, Router } from 'express'
import type ConversationsController from './conversations.controller.js'

// History of the chat over HTTP; the chat itself goes over Socket.IO.
const buildChatRoutes = (requireAuth: RequestHandler, conversations: ConversationsController) => {
    const router = Router()
    router.use(requireAuth)

    router.get('/conversations', conversations.list)
    router.get('/conversations/:id', conversations.get)
    router.delete('/conversations/:id', conversations.delete)

    return router
}

export default buildChatRoutes
