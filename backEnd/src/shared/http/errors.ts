// Errors that are safe to expose to the client. Anything that is not an
// AppError is treated as unexpected and answered with a generic 500.
export class AppError extends Error {
    constructor(
        message: string,
        readonly statusCode: number,
        readonly code: string,
    ) {
        super(message)
        this.name = new.target.name
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request', code = 'BAD_REQUEST') {
        super(message, 400, code)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        super(message, 401, code)
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code = 'FORBIDDEN') {
        super(message, 403, code)
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Not found', code = 'NOT_FOUND') {
        super(message, 404, code)
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Conflict', code = 'CONFLICT') {
        super(message, 409, code)
    }
}
