import { describe, expect, it, vi } from 'vitest'
import type { SkillContext } from '../../../../src/shared/skills/skill.js'
import type GetWeatherUseCase from '../../../../src/modules/weather/application/get-weather.use-case.js'
import type { GetWeatherResult } from '../../../../src/modules/weather/application/get-weather.use-case.js'
import { buildGetWeatherTool } from '../../../../src/modules/weather/presentation/weather.skill.js'

const context = (): SkillContext => ({
    uid: 'user-1',
    signal: new AbortController().signal,
    locate: async () => null,
    show: vi.fn(),
})

// Only execute() is used by the tool.
const toolReturning = (result: GetWeatherResult) =>
    buildGetWeatherTool({execute: async () => result} as unknown as GetWeatherUseCase)

describe('get_weather tool', () => {
    it('shows the report as a weather card and gives it to the model', async () => {
        const report = {place: {name: 'Madrid', country: 'ES', lat: 40.42, lon: -3.7}, localTime: '2026-10-23T20:30'} as GetWeatherResult
        const ctx = context()

        const result = await toolReturning(report).run({place: 'Madrid'}, ctx)

        expect(result).toBe(report)
        expect(ctx.show).toHaveBeenCalledExactlyOnceWith({type: 'weather', data: report})
    })

    it('shows nothing when there is no weather to show', async () => {
        const ctx = context()

        const result = await toolReturning({error: 'LOCATION_UNAVAILABLE'}).run({}, ctx)

        expect(result).toEqual({error: 'LOCATION_UNAVAILABLE'})
        expect(ctx.show).not.toHaveBeenCalled()
    })
})
