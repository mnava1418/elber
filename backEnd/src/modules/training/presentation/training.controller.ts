import type { Request, Response } from 'express'
import { authUser } from '../../../shared/http/middlewares/auth.middleware.js'
import type GetProgressUseCase from '../application/get-progress.use-case.js'
import type GetSummaryUseCase from '../application/get-summary.use-case.js'
import type ManageMeasurementsUseCase from '../application/manage-measurements.use-case.js'
import type ManagePlansUseCase from '../application/manage-plans.use-case.js'
import type ManageProfileUseCase from '../application/manage-profile.use-case.js'
import type TrackSessionsUseCase from '../application/track-sessions.use-case.js'
import { MeasurementNotFoundError, PlanNotFoundError } from '../domain/errors.js'
import {
    closePlanSchema, createPlanSchema, markSessionSchema, measurementSchema, parse, planDraftSchema,
    profileChangesSchema, sessionsQuerySchema, todayQuerySchema,
} from './training.schemas.js'

export interface TrainingUseCases {
    profile: ManageProfileUseCase
    plans: ManagePlansUseCase
    sessions: TrackSessionsUseCase
    measurements: ManageMeasurementsUseCase
    summary: GetSummaryUseCase
    progress: GetProgressUseCase
}

// Firestore's auto ids. Anything else can't exist, and is answered like an
// id that doesn't (it also keeps a "/" from reaching a document path).
const DOCUMENT_ID = /^[A-Za-z0-9]{1,40}$/

const planId = (req: Request): string => {
    const id = String(req.params.id)
    if (!DOCUMENT_ID.test(id)) throw new PlanNotFoundError(id)
    return id
}

// The training page's API. Domain errors are turned into HTTP answers by the
// router (training.routes.ts), so each handler only does its job.
class TrainingController {
    constructor(private readonly useCases: TrainingUseCases) {}

    getProfile = async (_req: Request, res: Response) => {
        res.json(await this.useCases.profile.get(authUser(res).uid))
    }

    updateProfile = async (req: Request, res: Response) => {
        const changes = parse(profileChangesSchema, req.body)
        res.json(await this.useCases.profile.update(authUser(res).uid, changes))
    }

    listPlans = async (_req: Request, res: Response) => {
        res.json({plans: await this.useCases.plans.list(authUser(res).uid)})
    }

    getPlan = async (req: Request, res: Response) => {
        res.json(await this.useCases.plans.get(authUser(res).uid, planId(req)))
    }

    createPlan = async (req: Request, res: Response) => {
        const {startedOn, ...draft} = parse(createPlanSchema, req.body)
        res.status(201).json(await this.useCases.plans.create(authUser(res).uid, draft, startedOn))
    }

    updatePlan = async (req: Request, res: Response) => {
        const id = planId(req)
        const draft = parse(planDraftSchema, req.body)
        res.json(await this.useCases.plans.update(authUser(res).uid, id, draft))
    }

    closePlan = async (req: Request, res: Response) => {
        const id = planId(req)
        const {closedOn} = parse(closePlanSchema, req.body)
        res.json(await this.useCases.plans.close(authUser(res).uid, id, closedOn))
    }

    listSessions = async (req: Request, res: Response) => {
        const range = parse(sessionsQuerySchema, req.query, 'INVALID_QUERY')
        res.json({sessions: await this.useCases.sessions.list(authUser(res).uid, range)})
    }

    markSession = async (req: Request, res: Response) => {
        const {routineId, today} = parse(markSessionSchema, req.body)
        res.json(await this.useCases.sessions.mark(authUser(res).uid, {date: String(req.params.date), routineId, today}))
    }

    unmarkSession = async (req: Request, res: Response) => {
        await this.useCases.sessions.unmark(authUser(res).uid, String(req.params.date))
        res.status(204).end()
    }

    listMeasurements = async (_req: Request, res: Response) => {
        res.json({measurements: await this.useCases.measurements.list(authUser(res).uid)})
    }

    addMeasurement = async (req: Request, res: Response) => {
        const draft = parse(measurementSchema, req.body)
        res.status(201).json(await this.useCases.measurements.add(authUser(res).uid, draft))
    }

    deleteMeasurement = async (req: Request, res: Response) => {
        const id = String(req.params.id)
        if (!DOCUMENT_ID.test(id)) throw new MeasurementNotFoundError(id)
        await this.useCases.measurements.delete(authUser(res).uid, id)
        res.status(204).end()
    }

    summary = async (req: Request, res: Response) => {
        const {today} = parse(todayQuerySchema, req.query, 'INVALID_QUERY')
        res.json(await this.useCases.summary.execute(authUser(res).uid, today))
    }

    progress = async (_req: Request, res: Response) => {
        res.json(await this.useCases.progress.execute(authUser(res).uid))
    }
}

export default TrainingController
