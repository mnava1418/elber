import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors.js'

// Errors thrown by Express itself or its body parsers (http-errors) carry a
// status and flag whether their message is safe to show.
interface HttpError extends Error {
    status: number
    expose?: boolean
}

const isHttpError = (err: unknown): err is HttpError =>
    err instanceof Error && typeof (err as HttpError).status === 'number'

// Must keep 4 parameters: that is how Express recognizes an error handler.
const errorHandler = (err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err)
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({error: {code: err.code, message: err.message}})
    }

    if (isHttpError(err) && err.status < 500 && err.expose) {
        return res.status(err.status).json({error: {code: 'BAD_REQUEST', message: err.message}})
    }

    console.error(err)
    return res.status(500).json({error: {code: 'INTERNAL_ERROR', message: 'Internal server error'}})
}

export default errorHandler
