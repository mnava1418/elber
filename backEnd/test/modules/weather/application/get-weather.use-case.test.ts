import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Coords, SkillContext } from '../../../../src/shared/skills/skill.js'
import GetWeatherUseCase from '../../../../src/modules/weather/application/get-weather.use-case.js'
import type { Forecast, Place } from '../../../../src/modules/weather/domain/weather.js'
import type { WeatherProvider } from '../../../../src/modules/weather/domain/weather-provider.port.js'

const MADRID: Place = {name: 'Madrid', state: 'Comunidad de Madrid', country: 'ES', lat: 40.42, lon: -3.7}
const HERE: Coords = {lat: 19.43, lon: -99.13}
const FORECAST = {localTime: '2026-10-23T18:00'} as Forecast

describe('GetWeatherUseCase', () => {
    // Fake adapter: no requests to OpenWeather.
    const findPlace = vi.fn<WeatherProvider['findPlace']>()
    const placeAt = vi.fn<WeatherProvider['placeAt']>()
    const forecast = vi.fn<WeatherProvider['forecast']>()
    const locate = vi.fn<SkillContext['locate']>()
    const signal = new AbortController().signal
    const context: SkillContext = {uid: 'user-1', signal, locate}

    let useCase: GetWeatherUseCase

    beforeEach(() => {
        vi.resetAllMocks()
        forecast.mockResolvedValue(FORECAST)
        useCase = new GetWeatherUseCase({findPlace, placeAt, forecast})
    })

    it('gets the weather of the named place without asking for the location', async () => {
        findPlace.mockResolvedValue(MADRID)

        const result = await useCase.execute({place: ' Madrid '}, context)

        expect(findPlace).toHaveBeenCalledExactlyOnceWith('Madrid', signal)
        expect(forecast).toHaveBeenCalledExactlyOnceWith(MADRID, signal)
        expect(locate).not.toHaveBeenCalled()
        expect(result).toEqual({place: MADRID, ...FORECAST})
    })

    it('tells the model when the place does not exist', async () => {
        findPlace.mockResolvedValue(null)

        const result = await useCase.execute({place: 'Narnia'}, context)

        expect(result).toEqual({error: 'PLACE_NOT_FOUND', place: 'Narnia'})
        expect(forecast).not.toHaveBeenCalled()
    })

    it('uses the current location when no place is given', async () => {
        locate.mockResolvedValue(HERE)
        const mexico: Place = {name: 'Ciudad de México', country: 'MX', ...HERE}
        placeAt.mockResolvedValue(mexico)

        const result = await useCase.execute({place: '  '}, context)

        expect(placeAt).toHaveBeenCalledExactlyOnceWith(HERE, signal)
        expect(forecast).toHaveBeenCalledExactlyOnceWith(HERE, signal)
        expect(result).toEqual({place: mexico, ...FORECAST})
    })

    it('still answers when the current location has no name', async () => {
        locate.mockResolvedValue(HERE)
        placeAt.mockResolvedValue(null)

        const result = await useCase.execute({}, context)

        expect(result).toEqual({place: {name: 'Ubicación actual', country: '', ...HERE}, ...FORECAST})
    })

    it('tells the model when the location is unavailable', async () => {
        locate.mockResolvedValue(null)

        const result = await useCase.execute({}, context)

        expect(result).toEqual({error: 'LOCATION_UNAVAILABLE'})
        expect(forecast).not.toHaveBeenCalled()
    })
})
