import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OpenWeatherProvider, { toForecast, type OneCall } from '../../../../../../src/modules/chat/skills/weather/infrastructure/openweather-provider.js'

const KEY = 'test-key'
// 2026-10-23T18:30:00Z
const NOW = Date.UTC(2026, 9, 23, 18, 30) / 1000
const HOUR = 3600
// Madrid in October: UTC+2.
const OFFSET = 2 * HOUR

const ONE_CALL: OneCall = {
    timezone_offset: OFFSET,
    current: {dt: NOW, temp: 17.26, feels_like: 16.84, humidity: 72, uvi: 0.4, wind_speed: 3, weather: [{description: 'nubes', icon: '04n'}]},
    hourly: [
        // Ended an hour ago: left out.
        {dt: NOW - 1.5 * HOUR, temp: 18, pop: 0, weather: [{description: 'nubes', icon: '04n'}]},
        {dt: NOW - 0.5 * HOUR, temp: 17.2, pop: 0.35, rain: {'1h': 0.42}, weather: [{description: 'lluvia ligera', icon: '10n'}]},
        {dt: NOW + 0.5 * HOUR, temp: 16, pop: 0, weather: [{description: 'cielo claro', icon: '01n'}]},
    ],
    daily: [{
        dt: NOW, summary: 'Lluvia por la tarde', temp: {min: 11.04, max: 19.96}, pop: 0.6, rain: 2.345,
        weather: [{description: 'lluvia', icon: '10d'}],
    }],
    alerts: [{event: 'Viento', start: NOW, end: NOW + 6 * HOUR, description: 'Rachas fuertes'}],
}

describe('toForecast', () => {
    it('trims the response and gives times in the place\'s local time', () => {
        expect(toForecast(ONE_CALL, NOW)).toEqual({
            localTime: '2026-10-23T20:30',
            current: {description: 'nubes', icon: '04n', temp: 17.3, feelsLike: 16.8, humidity: 72, windKmh: 10.8, uvIndex: 0.4},
            hourly: [
                {time: '2026-10-23T20:00', description: 'lluvia ligera', icon: '10n', temp: 17.2, rainChance: 35, rainMm: 0.4},
                {time: '2026-10-23T21:00', description: 'cielo claro', icon: '01n', temp: 16, rainChance: 0},
            ],
            daily: [{date: '2026-10-23', summary: 'Lluvia por la tarde', icon: '10d', min: 11, max: 20, rainChance: 60, rainMm: 2.3}],
            alerts: [{event: 'Viento', start: '2026-10-23T20:30', end: '2026-10-24T02:30', description: 'Rachas fuertes'}],
        })
    })

    it('keeps only the next 24 hours', () => {
        const hourly = Array.from({length: 48}, (_, i) => ({dt: NOW + i * HOUR, temp: 10, pop: 0, weather: []}))

        expect(toForecast({...ONE_CALL, hourly}, NOW).hourly).toHaveLength(24)
    })
})

describe('OpenWeatherProvider', () => {
    const fetchMock = vi.fn<typeof fetch>()
    const signal = new AbortController().signal
    let provider: OpenWeatherProvider

    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock)
        provider = new OpenWeatherProvider(KEY)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.resetAllMocks()
    })

    const respond = (body: unknown, status = 200) =>
        fetchMock.mockResolvedValue(new Response(JSON.stringify(body), {status}))

    const requested = () => new URL(fetchMock.mock.calls[0]![0] as URL)

    it('finds a place by name, with its Spanish name', async () => {
        respond([{name: 'London', local_names: {es: 'Londres'}, state: 'England', country: 'GB', lat: 51.5, lon: -0.12}])

        const place = await provider.findPlace('Londres', signal)

        expect(requested().pathname).toBe('/geo/1.0/direct')
        expect(Object.fromEntries(requested().searchParams)).toEqual({q: 'Londres', limit: '1', appid: KEY})
        expect(place).toEqual({name: 'Londres', state: 'England', country: 'GB', lat: 51.5, lon: -0.12})
    })

    it('returns null when no place matches', async () => {
        respond([])

        expect(await provider.findPlace('Narnia', signal)).toBeNull()
    })

    it('names the place at some coordinates', async () => {
        respond([{name: 'Mexico City', local_names: {es: 'Ciudad de México'}, country: 'MX', lat: 19.43, lon: -99.13}])

        const place = await provider.placeAt({lat: 19.43, lon: -99.13}, signal)

        expect(requested().pathname).toBe('/geo/1.0/reverse')
        expect(place).toEqual({name: 'Ciudad de México', country: 'MX', lat: 19.43, lon: -99.13})
    })

    it('asks One Call for metric units in Spanish, without minutely data', async () => {
        respond(ONE_CALL)

        await provider.forecast({lat: 40.42, lon: -3.7}, signal)

        expect(requested().pathname).toBe('/data/3.0/onecall')
        expect(Object.fromEntries(requested().searchParams)).toEqual({
            lat: '40.42', lon: '-3.7', units: 'metric', lang: 'es', exclude: 'minutely', appid: KEY,
        })
    })

    it('throws on an error response without leaking the key', async () => {
        respond({cod: 401, message: 'Invalid API key'}, 401)

        const error = await provider.forecast({lat: 0, lon: 0}, signal).catch((e: Error) => e)

        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('401')
        expect((error as Error).message).not.toContain(KEY)
    })
})
