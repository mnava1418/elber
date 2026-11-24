import { describe, expect, it } from 'vitest'
import GetProgressUseCase from '../../../../src/modules/training/application/get-progress.use-case.js'
import GetSummaryUseCase from '../../../../src/modules/training/application/get-summary.use-case.js'
import ManageMeasurementsUseCase from '../../../../src/modules/training/application/manage-measurements.use-case.js'
import ManagePlansUseCase from '../../../../src/modules/training/application/manage-plans.use-case.js'
import ManageProfileUseCase from '../../../../src/modules/training/application/manage-profile.use-case.js'
import TrackSessionsUseCase from '../../../../src/modules/training/application/track-sessions.use-case.js'
import { buildCoach } from '../../../../src/modules/training/presentation/coach.js'
import { InMemoryMeasurements, InMemoryPlans, InMemoryProfiles, InMemorySessions, planDraft } from '../in-memory-training.js'

const TODAY = '2026-11-20'

const coachOverMemory = () => {
    const repos = {profiles: new InMemoryProfiles(), plans: new InMemoryPlans(), sessions: new InMemorySessions(), measurements: new InMemoryMeasurements()}
    const sessions = new TrackSessionsUseCase(repos.sessions, repos.plans)
    const plans = new ManagePlansUseCase(repos.plans)
    return {
        sessions,
        plans,
        coach: buildCoach({
            profile: new ManageProfileUseCase(repos.profiles),
            plans,
            sessions,
            measurements: new ManageMeasurementsUseCase(repos.measurements),
            summary: new GetSummaryUseCase(repos.profiles, repos.plans, repos.sessions, repos.measurements),
            progress: new GetProgressUseCase(repos.plans, repos.measurements),
        }),
    }
}

describe('coach (the training data as the chat sees it)', () => {
    it("turns the domain's errors into results the model reacts to", async () => {
        const {coach} = coachOverMemory()
        const plan = await coach.createPlan('uid-1', planDraft(), TODAY)

        expect(await coach.createPlan('uid-1', planDraft(), TODAY)).toEqual({error: 'PLAN_ALREADY_ACTIVE'})
        expect(await coach.updateProfile('uid-1', {daysPerWeek: 9})).toEqual({error: 'INVALID_DATA', message: 'daysPerWeek must be an integer between 1 and 7'})
        expect(await coach.updatePlan('uid-1', 'nope', planDraft())).toEqual({error: 'PLAN_NOT_FOUND'})
        expect('id' in plan).toBe(true)
    })

    it('gives the progress with the days trained in the last four weeks', async () => {
        const {coach, sessions} = coachOverMemory()
        for (const date of ['2026-10-01', '2026-11-01', TODAY]) await sessions.mark('uid-1', {date, routineId: null, today: TODAY})

        const progress = await coach.getProgress('uid-1', TODAY)

        expect(progress.recentSessions.map((s) => s.date)).toEqual(['2026-11-01', TODAY])
        expect(progress.summary.streak.totalDays).toBe(3)
    })

    it("can't close plans", () => {
        expect(Object.keys(coachOverMemory().coach)).not.toContain('closePlan')
    })
})
