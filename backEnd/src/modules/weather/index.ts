import env from '../../config/env.js'
import type { SkillTool } from '../../shared/skills/skill.js'
import GetWeatherUseCase from './application/get-weather.use-case.js'
import OpenWeatherProvider from './infrastructure/openweather-provider.js'
import { buildGetWeatherTool } from './presentation/weather.skill.js'

// Public entry point of the weather skill: it has no routes or events, only
// tools the chat offers to the assistant.
export interface WeatherModule {
    tools: SkillTool[]
}

const createWeatherModule = (): WeatherModule => {
    // To switch weather provider, swap this adapter for another WeatherProvider.
    const getWeather = new GetWeatherUseCase(new OpenWeatherProvider(env.OPENWEATHER_API_KEY))

    return {
        tools: [buildGetWeatherTool(getWeather)],
    }
}

export default createWeatherModule
