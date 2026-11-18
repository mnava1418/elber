import env from '../../../../config/env.js'
import type { Skill } from '../../domain/skill.js'
import GetWeatherUseCase from './application/get-weather.use-case.js'
import OpenWeatherProvider from './infrastructure/openweather-provider.js'
import { buildGetWeatherTool } from './presentation/weather.skill.js'

// Public entry point of the weather skill: only the chat's index.ts imports
// it. It has no routes or events, only tools the chat offers to the assistant.
const createWeatherSkill = (): Skill => {
    // To switch weather provider, swap this adapter for another WeatherProvider.
    const getWeather = new GetWeatherUseCase(new OpenWeatherProvider(env.OPENWEATHER_API_KEY))

    return {
        tools: [buildGetWeatherTool(getWeather)],
    }
}

export default createWeatherSkill
