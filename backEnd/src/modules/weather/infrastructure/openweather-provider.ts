import type { Coords } from '../../../shared/skills/skill.js'
import type { Forecast, Place } from '../domain/weather.js'
import type { WeatherProvider } from '../domain/weather-provider.port.js'

const BASE_URL = 'https://api.openweathermap.org'
const TIMEOUT_MS = 10_000
// Descriptions in Spanish; the model translates if the user writes in another language.
const LANG = 'es'
const HOURS = 24

// Only the fields used. https://openweathermap.org/api/geocoding-api
interface GeoPlace {
    name: string
    local_names?: Record<string, string>
    state?: string
    country: string
    lat: number
    lon: number
}

// https://openweathermap.org/api/one-call-3
interface Condition {
    description: string
}

export interface OneCall {
    timezone_offset: number
    current: {
        dt: number
        temp: number
        feels_like: number
        humidity: number
        uvi: number
        wind_speed: number
        weather: Condition[]
    }
    hourly?: {
        dt: number
        temp: number
        pop: number
        rain?: {'1h': number}
        snow?: {'1h': number}
        weather: Condition[]
    }[]
    daily?: {
        dt: number
        summary?: string
        temp: {min: number, max: number}
        pop: number
        rain?: number
        snow?: number
        weather: Condition[]
    }[]
    alerts?: {
        event: string
        start: number
        end: number
        description: string
    }[]
}

// Adapter: OpenWeather's One Call 3.0 (needs that subscription) and Geocoding.
class OpenWeatherProvider implements WeatherProvider {
    constructor(private readonly apiKey: string) {}

    findPlace = async (query: string, signal: AbortSignal) => {
        const [place] = await this.get<GeoPlace[]>('/geo/1.0/direct', {q: query, limit: '1'}, signal)
        return place ? toPlace(place) : null
    }

    placeAt = async ({lat, lon}: Coords, signal: AbortSignal) => {
        const [place] = await this.get<GeoPlace[]>('/geo/1.0/reverse', {lat: String(lat), lon: String(lon), limit: '1'}, signal)
        return place ? toPlace(place) : null
    }

    forecast = async ({lat, lon}: Coords, signal: AbortSignal) => {
        const data = await this.get<OneCall>('/data/3.0/onecall', {
            lat: String(lat),
            lon: String(lon),
            units: 'metric',
            lang: LANG,
            exclude: 'minutely',
        }, signal)
        return toForecast(data, Date.now() / 1000)
    }

    private get = async <T>(path: string, params: Record<string, string>, signal: AbortSignal): Promise<T> => {
        const url = new URL(path, BASE_URL)
        url.search = new URLSearchParams({...params, appid: this.apiKey}).toString()
        const response = await fetch(url, {signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])})
        if (!response.ok) {
            // Without the URL: it has the key.
            throw new Error(`OpenWeather ${path} failed: ${response.status} ${await response.text()}`)
        }
        return await response.json() as T
    }
}

const toPlace = (place: GeoPlace): Place => ({
    name: place.local_names?.[LANG] ?? place.name,
    ...(place.state ? {state: place.state} : {}),
    country: place.country,
    lat: place.lat,
    lon: place.lon,
})

// Exported for tests. `now` in Unix seconds.
export const toForecast = (data: OneCall, now: number): Forecast => {
    const offset = data.timezone_offset
    const {current} = data
    return {
        localTime: localTime(now, offset),
        current: {
            description: describe(current.weather),
            temp: round(current.temp),
            feelsLike: round(current.feels_like),
            humidity: current.humidity,
            windKmh: round(current.wind_speed * 3.6),
            uvIndex: round(current.uvi),
        },
        // The first hour is the current one, already started.
        hourly: (data.hourly ?? []).filter((hour) => hour.dt + 3600 > now).slice(0, HOURS).map((hour) => ({
            time: localTime(hour.dt, offset),
            description: describe(hour.weather),
            temp: round(hour.temp),
            rainChance: chance(hour.pop),
            ...amounts(hour.rain?.['1h'], hour.snow?.['1h']),
        })),
        daily: (data.daily ?? []).map((day) => ({
            date: localTime(day.dt, offset).slice(0, 10),
            summary: day.summary ?? describe(day.weather),
            min: round(day.temp.min),
            max: round(day.temp.max),
            rainChance: chance(day.pop),
            ...amounts(day.rain, day.snow),
        })),
        alerts: (data.alerts ?? []).map((alert) => ({
            event: alert.event,
            start: localTime(alert.start, offset),
            end: localTime(alert.end, offset),
            description: alert.description,
        })),
    }
}

// Unix seconds -> "YYYY-MM-DDTHH:mm" in the place's time zone.
const localTime = (seconds: number, offset: number) => new Date((seconds + offset) * 1000).toISOString().slice(0, 16)

const describe = (conditions: Condition[]) => conditions.map((condition) => condition.description).join(', ')

const round = (value: number) => Math.round(value * 10) / 10

const chance = (pop: number) => Math.round(pop * 100)

// Left out when there's none: fewer tokens for the model.
const amounts = (rain?: number, snow?: number) => ({
    ...(rain ? {rainMm: round(rain)} : {}),
    ...(snow ? {snowMm: round(snow)} : {}),
})

export default OpenWeatherProvider
