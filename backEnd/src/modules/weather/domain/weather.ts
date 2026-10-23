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

// OpenWeather's icon code, e.g. "10d" (rain, day): https://openweathermap.org/weather-conditions
// The model doesn't need it; the weather card draws it.
type Icon = string

// Times are the place's local time, "YYYY-MM-DDTHH:mm" (dates "YYYY-MM-DD"):
// the model answers in the place's time without converting anything.
// Temperatures in °C, wind in km/h, rain and snow in mm, chances 0-100.
export interface Forecast {
    // Now, where the place is: the model doesn't know the date otherwise.
    localTime: string
    current: {
        description: string
        icon: Icon
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
        icon: Icon
        temp: number
        rainChance: number
        rainMm?: number
        snowMm?: number
    }[]
    // Today and the next 7 days.
    daily: {
        date: string
        summary: string
        icon: Icon
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
