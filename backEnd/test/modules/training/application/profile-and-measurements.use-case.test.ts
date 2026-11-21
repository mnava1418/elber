import { beforeEach, describe, expect, it } from 'vitest'
import ManageMeasurementsUseCase from '../../../../src/modules/training/application/manage-measurements.use-case.js'
import ManageProfileUseCase from '../../../../src/modules/training/application/manage-profile.use-case.js'
import { InvalidTrainingDataError, MeasurementNotFoundError } from '../../../../src/modules/training/domain/errors.js'
import { EMPTY_PROFILE } from '../../../../src/modules/training/domain/profile.js'
import { InMemoryMeasurements, InMemoryProfiles } from '../in-memory-training.js'

describe('ManageProfileUseCase', () => {
    let profiles: InMemoryProfiles
    let useCase: ManageProfileUseCase

    beforeEach(() => {
        profiles = new InMemoryProfiles()
        useCase = new ManageProfileUseCase(profiles)
    })

    it('starts empty', async () => {
        expect(await useCase.get('uid-1')).toEqual(EMPTY_PROFILE)
    })

    it('saves only what changed, update after update', async () => {
        await useCase.update('uid-1', {goal: 'Fuerza', daysPerWeek: 3})
        const profile = await useCase.update('uid-1', {daysPerWeek: 4, injuries: 'Rodilla derecha'})

        expect(profile).toEqual({...EMPTY_PROFILE, goal: 'Fuerza', daysPerWeek: 4, injuries: 'Rodilla derecha'})
        expect(await useCase.get('uid-1')).toEqual(profile)
    })

    it('saves nothing when a field breaks a rule', async () => {
        await expect(useCase.update('uid-1', {goal: 'Fuerza', daysPerWeek: 9})).rejects.toThrow(InvalidTrainingDataError)
        expect(profiles.profiles.size).toBe(0)
    })
})

describe('ManageMeasurementsUseCase', () => {
    let useCase: ManageMeasurementsUseCase
    const draft = {weightKg: 80, bodyFatPct: null, waistCm: 85, hipCm: null, chestCm: null, armCm: null, thighCm: null}

    beforeEach(() => {
        useCase = new ManageMeasurementsUseCase(new InMemoryMeasurements())
    })

    it('adds and lists them oldest first', async () => {
        await useCase.add('uid-1', {...draft, date: '2026-11-20'})
        await useCase.add('uid-1', {...draft, date: '2026-10-20', weightKg: 82})

        expect((await useCase.list('uid-1')).map((m) => m.weightKg)).toEqual([82, 80])
    })

    it('rejects invalid values', async () => {
        await expect(useCase.add('uid-1', {...draft, date: '2026-11-20', weightKg: -1})).rejects.toThrow(InvalidTrainingDataError)
    })

    it("deletes one, but not someone else's", async () => {
        const {id} = await useCase.add('uid-1', {...draft, date: '2026-11-20'})

        await expect(useCase.delete('uid-2', id)).rejects.toThrow(MeasurementNotFoundError)
        await useCase.delete('uid-1', id)
        expect(await useCase.list('uid-1')).toEqual([])
    })
})
