import { InvalidTrainingDataError } from './errors.js'
import { checkOptionalNumber, checkOptionalText } from './validation.js'

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type Level = typeof LEVELS[number]

// Where the user trains: a gym, at home, or both.
export const PLACES = ['gym', 'home', 'mixed'] as const
export type Place = typeof PLACES[number]

// What a coach needs to know to build a plan. Every field starts unknown
// (null): Elber fills it in while talking, and the user edits it in the page.
export interface TrainingProfile {
    // In the user's words: "bajar grasa y ganar fuerza".
    goal: string | null
    level: Level | null
    // Also the weekly target of the streak when there is no active plan.
    daysPerWeek: number | null
    minutesPerSession: number | null
    place: Place | null
    equipment: string | null
    injuries: string | null
    // Exercises they like or avoid, schedule...
    preferences: string | null
    heightCm: number | null
}

export const EMPTY_PROFILE: TrainingProfile = {
    goal: null, level: null, daysPerWeek: null, minutesPerSession: null, place: null,
    equipment: null, injuries: null, preferences: null, heightCm: null,
}

// A partial update: a missing field stays as it is, null clears it.
export type ProfileChanges = Partial<TrainingProfile>

export const applyProfileChanges = (profile: TrainingProfile, changes: ProfileChanges): TrainingProfile => {
    const next = {...profile}
    for (const key of Object.keys(EMPTY_PROFILE) as (keyof TrainingProfile)[]) {
        if (changes[key] !== undefined) (next as Record<string, unknown>)[key] = changes[key]
    }
    return validateProfile(next)
}

export const validateProfile = (profile: TrainingProfile): TrainingProfile => {
    checkOptionalText('goal', profile.goal)
    if (profile.level !== null && !LEVELS.includes(profile.level)) throw new InvalidTrainingDataError(`level must be one of ${LEVELS.join(', ')}`)
    checkOptionalNumber('daysPerWeek', profile.daysPerWeek, 1, 7, true)
    checkOptionalNumber('minutesPerSession', profile.minutesPerSession, 10, 300, true)
    if (profile.place !== null && !PLACES.includes(profile.place)) throw new InvalidTrainingDataError(`place must be one of ${PLACES.join(', ')}`)
    checkOptionalText('equipment', profile.equipment)
    checkOptionalText('injuries', profile.injuries)
    checkOptionalText('preferences', profile.preferences)
    checkOptionalNumber('heightCm', profile.heightCm, 100, 250)
    return profile
}
