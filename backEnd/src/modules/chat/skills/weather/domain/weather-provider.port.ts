import type { Coords } from '../../../domain/skill.js'
import type { Forecast, Place } from './weather.js'

// Port: where the weather comes from. Each provider (OpenWeather...) is an
// adapter in infrastructure/ implementing it.
export interface WeatherProvider {
    // The best match for a name like "Madrid" or "Toluca, MX". null if none.
    findPlace(query: string, signal: AbortSignal): Promise<Place | null>
    // The place at those coordinates. null if the provider has no name for it.
    placeAt(coords: Coords, signal: AbortSignal): Promise<Place | null>
    forecast(coords: Coords, signal: AbortSignal): Promise<Forecast>
}
