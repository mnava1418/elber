import { RequestHandler, Router } from 'express'
import { ForbiddenError } from '../../../shared/http/errors.js'
import { authUser } from '../../../shared/http/middlewares/auth.middleware.js'
import type { DailyConversation } from '../domain/conversation.js'
import type ConversationsController from './conversations.controller.js'

// History of the chat over HTTP; the chat itself goes over Socket.IO.
// `canUse` keeps a section to some users (the diary, to the vault's owner).
const buildChatRoutes = (
    requireAuth: RequestHandler,
    conversations: ConversationsController,
    canUse: (uid: string) => boolean = () => true,
    daily?: DailyConversation,
) => {
    const router = Router()
    router.use(requireAuth)
    router.use((_req, res, next) => {
        if (!canUse(authUser(res).uid)) throw new ForbiddenError()
        next()
    })

    // Which conversation is today's, in a section with one per day: the
    // server decides when the day changes, not the browser.
    if (daily) router.get('/today', (_req, res) => { res.json(daily(new Date())) })

    router.get('/conversations', conversations.list)
    router.get('/conversations/:id', conversations.get)
    router.patch('/conversations/:id', conversations.rename)
    // Every conversation of the user at once.
    router.delete('/conversations', conversations.deleteAll)
    router.delete('/conversations/:id', conversations.delete)

    return router
}

export default buildChatRoutes
