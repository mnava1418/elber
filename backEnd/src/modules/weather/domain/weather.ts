// A place found by name or by coordinates.
export interface Place {
    name: string
    // Region or state, when the provider knows it.
    state?: string
    // ISO 3166 code, e.g. "MX".
    country: string
    lat: number
    lon: number
}

// Times are the place's local time, "YYYY-MM-DDTHH:mm" (dates "YYYY-MM-DD"):
// the model answers in the place's time without converting anything.
// Temperatures in °C, wind in km/h, rain and snow in mm, chances 0-100.
export interface Forecast {
    // Now, where the place is: the model doesn't know the date otherwise.
    localTime: string
    current: {
        description: string
        temp: number
        feelsLike: number
        humidity: number
        windKmh: number
        uvIndex: number
    }
    // The next 24 hours.
    hourly: {
        time: string
        description: string
        temp: number
        rainChance: number
        rainMm?: number
        snowMm?: number
    }[]
    // Today and the next 7 days.
    daily: {
        date: string
        summary: string
        min: number
        max: number
        rainChance: number
        rainMm?: number
        snowMm?: number
    }[]
    alerts: {
        event: string
        start: string
        end: string
        description: string
    }[]
}

export interface WeatherReport extends Forecast {
    place: Place
}
