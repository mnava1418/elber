import type { SkillContext } from '../../../shared/skills/skill.js'
import type { WeatherReport } from '../domain/weather.js'
import type { WeatherProvider } from '../domain/weather-provider.port.js'

export interface GetWeatherInput {
    // A place name; without it, the user's current location.
    place?: string
}

// The model reads these and reacts: asks for another place or for a city.
export type GetWeatherResult =
    | WeatherReport
    | {error: 'PLACE_NOT_FOUND', place: string}
    | {error: 'LOCATION_UNAVAILABLE'}

class GetWeatherUseCase {
    constructor(private readonly weather: WeatherProvider) {}

    execute = async ({place}: GetWeatherInput, {locate, signal}: SkillContext): Promise<GetWeatherResult> => {
        const query = place?.trim()
        if (query) {
            const found = await this.weather.findPlace(query, signal)
            if (!found) return {error: 'PLACE_NOT_FOUND', place: query}
            return {place: found, ...(await this.weather.forecast(found, signal))}
        }

        const coords = await locate()
        if (!coords) return {error: 'LOCATION_UNAVAILABLE'}
        // Without a name the coordinates still have weather.
        const [here, forecast] = await Promise.all([
            this.weather.placeAt(coords, signal),
            this.weather.forecast(coords, signal),
        ])
        return {place: here ?? {name: 'Ubicación actual', country: '', ...coords}, ...forecast}
    }
}

export default GetWeatherUseCase
