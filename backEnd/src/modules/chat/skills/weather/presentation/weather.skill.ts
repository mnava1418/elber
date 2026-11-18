import { z } from 'zod'
import { defineTool } from '../../../domain/skill.js'
import type GetWeatherUseCase from '../application/get-weather.use-case.js'

// Inbound adapter: what the assistant sees of the weather module.
export const buildGetWeatherTool = (getWeather: GetWeatherUseCase) => defineTool({
    name: 'get_weather',
    description: 'Current weather, the next 24 hours, the next 8 days and official alerts for a place. '
        + 'Use it for any question about weather, temperature, rain, wind, UV, etc. '
        + 'Times in the result are the place\'s local time. '
        + 'The user also sees the result as a weather card (now, next hours, next days).',
    input: {
        place: z.string().max(200).optional().describe(
            'City or place, e.g. "Madrid" or "Toluca, MX". Leave it out when the user doesn\'t name one: '
            + 'their current location is used.',
        ),
    },
    run: async (input, context) => {
        const result = await getWeather.execute(input, context)
        if (!('error' in result)) context.show({type: 'weather', data: result})
        return result
    },
})
