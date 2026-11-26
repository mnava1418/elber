import { AddressInfo } from 'node:net'
import { Server } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import GetProgressUseCase from '../../../../src/modules/training/application/get-progress.use-case.js'
import GetSummaryUseCase from '../../../../src/modules/training/application/get-summary.use-case.js'
import ManageMeasurementsUseCase from '../../../../src/modules/training/application/manage-measurements.use-case.js'
import ManagePlansUseCase from '../../../../src/modules/training/application/manage-plans.use-case.js'
import ManageReadyPlanUseCase from '../../../../src/modules/training/application/manage-ready-plan.use-case.js'
import ManageProfileUseCase from '../../../../src/modules/training/application/manage-profile.use-case.js'
import TrackSessionsUseCase from '../../../../src/modules/training/application/track-sessions.use-case.js'
import TrainingController from '../../../../src/modules/training/presentation/training.controller.js'
import buildTrainingRoutes from '../../../../src/modules/training/presentation/training.routes.js'
import type { TokenVerifier } from '../../../../src/shared/auth/token-verifier.js'
import { buildRequireAuth } from '../../../../src/shared/http/middlewares/auth.middleware.js'
import errorHandler from '../../../../src/shared/http/middlewares/error.middleware.js'
import { InMemoryMeasurements, InMemoryPlans, InMemoryProfiles, InMemoryReadyPlans, InMemorySessions, planDraft } from '../in-memory-training.js'

// Routes, auth, validation and status codes through a real Express app on a
// random local port, with the real use cases over repositories in memory.
// Each token is the uid it belongs to ('uid-1' signs in as uid-1).
const verify: TokenVerifier = async (token) => token.startsWith('uid-') ? {uid: token} : null

const TODAY = '2026-11-20'
const MEASUREMENT = {date: TODAY, weightKg: 80, waistCm: 85}

describe('training routes', () => {
    let server: Server
    let base: string
    let readyPlans: InMemoryReadyPlans

    beforeEach(async () => {
        vi.restoreAllMocks()
        const repos = {profiles: new InMemoryProfiles(), plans: new InMemoryPlans(), sessions: new InMemorySessions(), measurements: new InMemoryMeasurements(), ready: new InMemoryReadyPlans()}
        let n = 0
        readyPlans = repos.ready
        const controller = new TrainingController({
            profile: new ManageProfileUseCase(repos.profiles),
            plans: new ManagePlansUseCase(repos.plans, () => `r${++n}`),
            readyPlan: new ManageReadyPlanUseCase(repos.ready, repos.plans, () => `r${++n}`),
            sessions: new TrackSessionsUseCase(repos.sessions, repos.plans),
            measurements: new ManageMeasurementsUseCase(repos.measurements),
            summary: new GetSummaryUseCase(repos.profiles, repos.plans, repos.sessions, repos.measurements),
            progress: new GetProgressUseCase(repos.plans, repos.measurements),
        })
        const app = express()
        app.use(express.json())
        app.use('/training', buildTrainingRoutes(buildRequireAuth(verify), controller))
        app.use(errorHandler)

        server = app.listen(0)
        await new Promise((resolve) => server.once('listening', resolve))
        base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/training`
    })

    afterEach(() => {
        server.close()
    })

    const call = async (method: string, path: string, body?: unknown, token = 'uid-1') => {
        const response = await fetch(`${base}${path}`, {
            method,
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
            body: body === undefined ? undefined : JSON.stringify(body),
        })
        const text = await response.text()
        return {status: response.status, body: text ? JSON.parse(text) : null}
    }

    const createPlan = async (token = 'uid-1') => (await call('POST', '/plans', {...planDraft(), startedOn: '2026-11-16'}, token)).body

    it('rejects requests without a valid token', async () => {
        expect((await call('GET', '/profile', undefined, 'nope')).status).toBe(401)
    })

    describe('profile', () => {
        it('starts empty and saves partial changes', async () => {
            expect((await call('GET', '/profile')).body.goal).toBeNull()

            const {status, body} = await call('PATCH', '/profile', {goal: 'Fuerza', daysPerWeek: 4})

            expect(status).toBe(200)
            expect(body).toMatchObject({goal: 'Fuerza', daysPerWeek: 4, level: null})
        })

        it('answers 400 for unknown fields, wrong types and broken rules', async () => {
            expect((await call('PATCH', '/profile', {admin: true})).body.error.code).toBe('INVALID_BODY')
            expect((await call('PATCH', '/profile', {daysPerWeek: 'four'})).body.error).toMatchObject({code: 'INVALID_BODY', message: expect.stringContaining('daysPerWeek')})
            expect(await call('PATCH', '/profile', {daysPerWeek: 9})).toEqual({
                status: 400, body: {error: {code: 'INVALID_TRAINING_DATA', message: 'daysPerWeek must be an integer between 1 and 7'}},
            })
        })
    })

    describe('plans', () => {
        it('creates, lists, gets, edits and closes a plan', async () => {
            const plan = await createPlan()
            expect(plan).toMatchObject({status: 'active', startedOn: '2026-11-16'})

            expect((await call('GET', '/plans')).body.plans).toHaveLength(1)
            expect((await call('GET', `/plans/${plan.id}`)).body).toEqual(plan)

            const edited = await call('PUT', `/plans/${plan.id}`, {...planDraft(), name: 'Fuerza base v2'})
            expect(edited).toMatchObject({status: 200, body: {name: 'Fuerza base v2'}})

            const closed = await call('POST', `/plans/${plan.id}/close`, {closedOn: TODAY})
            expect(closed).toMatchObject({status: 200, body: {status: 'closed', closedOn: TODAY}})
        })

        it('answers 409 for a second active plan and for editing a closed one', async () => {
            const plan = await createPlan()
            expect((await call('POST', '/plans', {...planDraft(), startedOn: TODAY})).body.error.code).toBe('PLAN_ALREADY_ACTIVE')

            await call('POST', `/plans/${plan.id}/close`, {closedOn: TODAY})
            expect(await call('PUT', `/plans/${plan.id}`, planDraft())).toMatchObject({status: 409, body: {error: {code: 'PLAN_CLOSED'}}})
        })

        it("answers 404 for someone else's plan and for ids that can't exist", async () => {
            const plan = await createPlan('uid-2')

            expect(await call('GET', `/plans/${plan.id}`)).toMatchObject({status: 404, body: {error: {code: 'PLAN_NOT_FOUND'}}})
            expect((await call('GET', '/plans/a.b')).status).toBe(404)
        })
    })

    describe('sessions', () => {
        it('marks, lists and unmarks a day', async () => {
            await createPlan()

            const marked = await call('PUT', `/sessions/${TODAY}`, {routineId: 'r2', today: TODAY})
            expect(marked).toMatchObject({status: 200, body: {date: TODAY, routineId: 'r2', routineName: 'Día B: Empuje'}})
            expect((await call('GET', '/sessions?from=2026-11-01')).body.sessions).toHaveLength(1)

            expect((await call('DELETE', `/sessions/${TODAY}`)).status).toBe(204)
            expect((await call('DELETE', `/sessions/${TODAY}`)).body.error.code).toBe('SESSION_NOT_FOUND')
        })

        it('answers 400 for a bad date, a future day or an unknown routine', async () => {
            expect((await call('PUT', '/sessions/ayer', {today: TODAY})).body.error.code).toBe('INVALID_TRAINING_DATA')
            expect((await call('PUT', '/sessions/2026-11-21', {today: TODAY})).body.error.code).toBe('INVALID_TRAINING_DATA')
            expect((await call('PUT', `/sessions/${TODAY}`, {routineId: 'zzz', today: TODAY})).body.error.code).toBe('ROUTINE_NOT_FOUND')
            expect((await call('GET', '/sessions?from=nov')).body.error.code).toBe('INVALID_TRAINING_DATA')
        })
    })

    describe('measurements', () => {
        it('adds, lists and deletes them', async () => {
            const added = await call('POST', '/measurements', MEASUREMENT)
            expect(added).toMatchObject({status: 201, body: {weightKg: 80, waistCm: 85, hipCm: null}})

            expect((await call('GET', '/measurements')).body.measurements).toHaveLength(1)
            expect((await call('DELETE', `/measurements/${added.body.id}`)).status).toBe(204)
            expect((await call('DELETE', `/measurements/${added.body.id}`)).body.error.code).toBe('MEASUREMENT_NOT_FOUND')
        })

        it('answers 400 without a weight', async () => {
            expect((await call('POST', '/measurements', {date: TODAY})).body.error.code).toBe('INVALID_BODY')
        })
    })

    describe('summary and progress', () => {
        it("needs the user's today", async () => {
            expect((await call('GET', '/summary')).body.error.code).toBe('INVALID_QUERY')
        })

        it('puts it together', async () => {
            await createPlan()
            await call('PUT', `/sessions/${TODAY}`, {routineId: 'r1', today: TODAY})

            const summary = await call('GET', `/summary?today=${TODAY}`)
            expect(summary.body).toMatchObject({todaySession: {routineId: 'r1'}, nextRoutine: {id: 'r2'}, measurementDue: true})

            const progress = await call('GET', '/progress')
            expect(progress.body.exercises.map((series: {key: string}) => series.key)).toContain('press de banca')
        })
    })

    describe('ready plan', () => {
        const prepare = () => readyPlans.save('uid-1', {...planDraft(), routines: [{id: 'x1', name: 'Día A', exercises: planDraft().routines[0]!.exercises}], preparedOn: '2026-11-18'})

        it('is edited, started and then gone from the page', async () => {
            await prepare()

            const edited = await call('PUT', '/plans/ready', {...planDraft(), name: 'Fuerza 2'})
            expect(edited.body).toMatchObject({name: 'Fuerza 2', preparedOn: '2026-11-18'})

            const started = await call('POST', '/plans/ready/start', {today: TODAY})
            expect(started.status).toBe(201)
            expect(started.body).toMatchObject({name: 'Fuerza 2', status: 'active', startedOn: TODAY})

            const page = await call('GET', `/page?today=${TODAY}&from=${TODAY}`)
            expect(page.body.readyPlan).toBeNull()
            expect(page.body.summary.activePlan.name).toBe('Fuerza 2')
        })

        it('answers 409 to start it over an active plan unless told to close it', async () => {
            await createPlan()
            await prepare()

            expect((await call('POST', '/plans/ready/start', {today: TODAY})).body.error.code).toBe('PLAN_ALREADY_ACTIVE')
            expect((await call('POST', '/plans/ready/start', {today: TODAY, closeActive: true})).status).toBe(201)
            expect((await call('GET', '/plans')).body.plans.map((p: {status: string}) => p.status)).toEqual(['active', 'closed'])
        })

        it('is discarded, and then answers 404', async () => {
            await prepare()

            expect((await call('DELETE', '/plans/ready')).status).toBe(204)
            expect((await call('DELETE', '/plans/ready')).body.error.code).toBe('READY_PLAN_NOT_FOUND')
            expect((await call('POST', '/plans/ready/start', {today: TODAY})).status).toBe(404)
        })
    })

    describe('page', () => {
        it('gives everything the page shows in one answer, with the days from the calendar start', async () => {
            await createPlan()
            await call('PUT', '/sessions/2026-11-02', {routineId: null, today: TODAY})
            await call('PUT', `/sessions/${TODAY}`, {routineId: 'r1', today: TODAY})

            const {status, body} = await call('GET', `/page?today=${TODAY}&from=2026-11-09`)

            expect(status).toBe(200)
            expect(body.summary).toMatchObject({today: TODAY, nextRoutine: {id: 'r2'}})
            expect(body.plans).toHaveLength(1)
            expect(body.sessions.map((s: {date: string}) => s.date)).toEqual([TODAY])
            expect(body.profile.goal).toBeNull()
            expect(body.progress.exercises.length).toBeGreaterThan(0)
        })

        it('needs today and the calendar start', async () => {
            expect((await call('GET', `/page?today=${TODAY}`)).body.error.code).toBe('INVALID_QUERY')
        })
    })

    it('answers 500 without details when storage fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(InMemoryProfiles.prototype, 'get').mockRejectedValue(new Error('firestore down'))

        expect(await call('GET', '/profile')).toEqual({status: 500, body: {error: {code: 'INTERNAL_ERROR', message: 'Internal server error'}}})
    })
})
