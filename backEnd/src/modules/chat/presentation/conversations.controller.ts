import { Request, Response } from 'express'
import { z } from 'zod'
import { authUser } from '../../../shared/http/middlewares/auth.middleware.js'
import { BadRequestError, NotFoundError } from '../../../shared/http/errors.js'
import type DeleteAllConversationsUseCase from '../application/delete-all-conversations.use-case.js'
import type DeleteConversationUseCase from '../application/delete-conversation.use-case.js'
import type GetConversationUseCase from '../application/get-conversation.use-case.js'
import type ListConversationsUseCase from '../application/list-conversations.use-case.js'
import type RenameConversationUseCase from '../application/rename-conversation.use-case.js'
import { ConversationNotFoundError, MAX_TITLE_LENGTH, oneLineTitle } from '../domain/conversation.js'
import { InvalidCursorError } from '../domain/conversation.repository.js'
import { isConversationId } from './conversation-id.js'

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 50

const listQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    cursor: z.string().min(1).optional(),
})

// Cleaned up before it's checked: a title of only spaces is no title.
const renameBodySchema = z.object({
    title: z.string().transform(oneLineTitle).pipe(z.string().min(1).max(MAX_TITLE_LENGTH)),
})

const conversationNotFound = () => new NotFoundError('This conversation does not exist', 'CONVERSATION_NOT_FOUND')

// An id that can't exist is answered like one that doesn't.
const conversationIdFrom = (req: Request): string => {
    const {id} = req.params
    if (!isConversationId(id)) throw conversationNotFound()
    return id
}

// Dates go out as ISO strings (res.json does it).
class ConversationsController {
    constructor(
        private readonly listConversations: ListConversationsUseCase,
        private readonly getConversation: GetConversationUseCase,
        private readonly deleteConversation: DeleteConversationUseCase,
        private readonly deleteAllConversations: DeleteAllConversationsUseCase,
        private readonly renameConversation: RenameConversationUseCase,
    ) {}

    list = async (req: Request, res: Response) => {
        const parsed = listQuerySchema.safeParse(req.query)
        if (!parsed.success) {
            throw new BadRequestError(`limit must be 1-${MAX_PAGE_SIZE} and cursor a non-empty string`, 'INVALID_QUERY')
        }

        try {
            const page = await this.listConversations.execute({uid: authUser(res).uid, ...parsed.data})
            res.status(200).json(page)
        } catch (error) {
            if (error instanceof InvalidCursorError) throw new BadRequestError('Invalid cursor', 'INVALID_CURSOR')
            throw error
        }
    }

    get = async (req: Request, res: Response) => {
        const conversationId = conversationIdFrom(req)
        try {
            const conversation = await this.getConversation.execute({uid: authUser(res).uid, conversationId})
            res.status(200).json(conversation)
        } catch (error) {
            if (error instanceof ConversationNotFoundError) throw conversationNotFound()
            throw error
        }
    }

    rename = async (req: Request, res: Response) => {
        const conversationId = conversationIdFrom(req)
        const parsed = renameBodySchema.safeParse(req.body)
        if (!parsed.success) throw new BadRequestError(`title must be 1-${MAX_TITLE_LENGTH} characters`, 'INVALID_BODY')
        try {
            const conversation = await this.renameConversation.execute({uid: authUser(res).uid, conversationId, title: parsed.data.title})
            res.status(200).json(conversation)
        } catch (error) {
            if (error instanceof ConversationNotFoundError) throw conversationNotFound()
            throw error
        }
    }

    delete = async (req: Request, res: Response) => {
        const conversationId = conversationIdFrom(req)
        try {
            await this.deleteConversation.execute({uid: authUser(res).uid, conversationId})
            res.status(204).end()
        } catch (error) {
            if (error instanceof ConversationNotFoundError) throw conversationNotFound()
            throw error
        }
    }

    deleteAll = async (_req: Request, res: Response) => {
        await this.deleteAllConversations.execute({uid: authUser(res).uid})
        res.status(204).end()
    }
}

export default ConversationsController
