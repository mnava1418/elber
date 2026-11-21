import { beforeEach, describe, expect, it } from 'vitest'
import GetProgressUseCase from '../../../../src/modules/training/application/get-progress.use-case.js'
import GetSummaryUseCase from '../../../../src/modules/training/application/get-summary.use-case.js'
import ManageMeasurementsUseCase from '../../../../src/modules/training/application/manage-measurements.use-case.js'
import ManagePlansUseCase from '../../../../src/modules/training/application/manage-plans.use-case.js'
import ManageProfileUseCase from '../../../../src/modules/training/application/manage-profile.use-case.js'
import TrackSessionsUseCase from '../../../../src/modules/training/application/track-sessions.use-case.js'
import { exercise, InMemoryMeasurements, InMemoryPlans, InMemoryProfiles, InMemorySessions, planDraft } from '../in-memory-training.js'

// Friday; the week started on Monday 16.
const TODAY = '2026-11-20'
const measurement = {weightKg: 80, bodyFatPct: null, waistCm: null, hipCm: null, chestCm: null, armCm: null, thighCm: null}

describe('GetSummaryUseCase and GetProgressUseCase', () => {
    let profile: ManageProfileUseCase
    let plans: ManagePlansUseCase
    let sessions: TrackSessionsUseCase
    let measurements: ManageMeasurementsUseCase
    let summary: GetSummaryUseCase
    let progress: GetProgressUseCase

    beforeEach(() => {
        const repos = {profiles: new InMemoryProfiles(), plans: new InMemoryPlans(), sessions: new InMemorySessions(), measurements: new InMemoryMeasurements()}
        let n = 0
        profile = new ManageProfileUseCase(repos.profiles)
        plans = new ManagePlansUseCase(repos.plans, () => `r${++n}`)
        sessions = new TrackSessionsUseCase(repos.sessions, repos.plans)
        measurements = new ManageMeasurementsUseCase(repos.measurements)
        summary = new GetSummaryUseCase(repos.profiles, repos.plans, repos.sessions, repos.measurements)
        progress = new GetProgressUseCase(repos.plans, repos.measurements)
    })

    it('starts empty, asking for a first measurement', async () => {
        expect(await summary.execute('uid-1', TODAY)).toEqual({
            today: TODAY,
            todaySession: null,
            streak: {weeks: 0, currentWeek: {weekStart: '2026-11-16', done: 0, target: 1}, totalDays: 0},
            activePlan: null,
            nextRoutine: null,
            lastMeasurement: null,
            measurementDue: true,
        })
    })

    it("puts together the plan, the rotation, the streak and today's session", async () => {
        await profile.update('uid-1', {daysPerWeek: 2})
        // Last week, without a plan: two days meet the profile's target.
        for (const date of ['2026-11-10', '2026-11-12']) await sessions.mark('uid-1', {date, routineId: null, today: TODAY})
        const plan = await plans.create('uid-1', planDraft(), '2026-11-16')
        await sessions.mark('uid-1', {date: '2026-11-17', routineId: 'r1', today: TODAY})
        await sessions.mark('uid-1', {date: TODAY, routineId: 'r2', today: TODAY})
        await measurements.add('uid-1', {...measurement, date: '2026-11-01'})

        const result = await summary.execute('uid-1', TODAY)

        expect(result.todaySession).toMatchObject({routineId: 'r2', routineName: 'Día B: Empuje'})
        expect(result.activePlan).toEqual({id: plan.id, name: 'Fuerza base', startedOn: '2026-11-16', plannedEndOn: '2026-12-13'})
        expect(result.nextRoutine).toEqual({id: 'r3', name: 'Día C: Jalón'})
        // This week's target is the plan's (3): two done, still going.
        expect(result.streak).toEqual({weeks: 1, currentWeek: {weekStart: '2026-11-16', done: 2, target: 3}, totalDays: 4})
        expect(result.lastMeasurement).toMatchObject({date: '2026-11-01'})
        expect(result.measurementDue).toBe(false)
    })

    it('gives the progress of each exercise from plan to plan, and the measurements', async () => {
        const first = await plans.create('uid-1', planDraft(), '2026-10-01')
        await plans.close('uid-1', first.id, '2026-10-31')
        await plans.create('uid-1', planDraft({routines: [{name: 'Día A', exercises: [exercise('Sentadilla Trasera', 70)]}]}), '2026-11-01')
        await measurements.add('uid-1', {...measurement, date: '2026-11-01'})

        const result = await progress.execute('uid-1')

        const squat = result.exercises.find((series) => series.key === 'sentadilla trasera')
        expect(squat?.points.map((p) => p.weightKg)).toEqual([60, 70])
        expect(result.measurements).toHaveLength(1)
    })
})
