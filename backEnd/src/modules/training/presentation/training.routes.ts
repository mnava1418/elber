import { Router, type ErrorRequestHandler, type RequestHandler } from 'express'
import { AppError, BadRequestError, ConflictError, NotFoundError } from '../../../shared/http/errors.js'
import {
    InvalidTrainingDataError, MeasurementNotFoundError, PlanAlreadyActiveError, PlanClosedError,
    PlanNotFoundError, RoutineNotFoundError, SessionNotFoundError,
} from '../domain/errors.js'
import type TrainingController from './training.controller.js'

// The domain's errors as HTTP answers. Each keeps its own code so the page
// can react (PLAN_ALREADY_ACTIVE: "close the current plan first").
const toHttpError = (error: unknown): unknown => {
    if (error instanceof AppError) return error
    if (error instanceof InvalidTrainingDataError) return new BadRequestError(error.message, 'INVALID_TRAINING_DATA')
    if (error instanceof RoutineNotFoundError) return new BadRequestError(error.message, 'ROUTINE_NOT_FOUND')
    if (error instanceof PlanNotFoundError) return new NotFoundError('This plan does not exist', 'PLAN_NOT_FOUND')
    if (error instanceof SessionNotFoundError) return new NotFoundError(error.message, 'SESSION_NOT_FOUND')
    if (error instanceof MeasurementNotFoundError) return new NotFoundError('This measurement does not exist', 'MEASUREMENT_NOT_FOUND')
    if (error instanceof PlanAlreadyActiveError) return new ConflictError(error.message, 'PLAN_ALREADY_ACTIVE')
    if (error instanceof PlanClosedError) return new ConflictError(error.message, 'PLAN_CLOSED')
    return error
}

const translateErrors: ErrorRequestHandler = (error, _req, _res, next) => next(toHttpError(error))

// Under /api/v1/training, for every signed-in user. Days are YYYY-MM-DD and
// "today" always comes from the user's device.
const buildTrainingRoutes = (requireAuth: RequestHandler, training: TrainingController) => {
    const router = Router()
    router.use(requireAuth)

    // What the page shows first: ?today=YYYY-MM-DD.
    router.get('/summary', training.summary)
    // The data behind the progress charts.
    router.get('/progress', training.progress)

    router.get('/profile', training.getProfile)
    router.patch('/profile', training.updateProfile)

    router.get('/plans', training.listPlans)
    router.post('/plans', training.createPlan)
    router.get('/plans/:id', training.getPlan)
    // Replaces what the plan says; only the active plan.
    router.put('/plans/:id', training.updatePlan)
    router.post('/plans/:id/close', training.closePlan)

    // ?from=&to=, both optional and inclusive.
    router.get('/sessions', training.listSessions)
    // One per day: marking a day again replaces it.
    router.put('/sessions/:date', training.markSession)
    router.delete('/sessions/:date', training.unmarkSession)

    router.get('/measurements', training.listMeasurements)
    router.post('/measurements', training.addMeasurement)
    router.delete('/measurements/:id', training.deleteMeasurement)

    router.use(translateErrors)
    return router
}

export default buildTrainingRoutes
