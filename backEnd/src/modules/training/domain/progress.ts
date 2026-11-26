import type { Plan } from './plan.js'

// How an exercise is recognized from plan to plan: "Sentadilla Trasera" and
// "sentadilla  trasera" are the same one. Elber is told to reuse the names
// already used, so this only has to absorb small differences.
export const exerciseKey = (name: string): string =>
    name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()

// An exercise's target in one plan: a point of its chart.
export interface ExercisePoint {
    planId: string
    planName: string
    startedOn: string
    sets: number
    reps: string
    weightLb: number | null
}

export interface ExerciseSeries {
    key: string
    // As the newest plan calls it.
    name: string
    // Oldest plan first.
    points: ExercisePoint[]
}

// The progress charts compare plans: the targets of each exercise in every
// plan it appears in. When a plan has it in more than one routine, the
// heaviest one counts.
export const exerciseSeries = (plans: Plan[]): ExerciseSeries[] => {
    const series = new Map<string, ExerciseSeries>()
    const oldestFirst = [...plans].sort((a, b) => a.startedOn.localeCompare(b.startedOn))
    for (const plan of oldestFirst) {
        const best = new Map<string, ExercisePoint & {name: string}>()
        for (const exercise of plan.routines.flatMap((routine) => routine.exercises)) {
            const key = exerciseKey(exercise.name)
            const current = best.get(key)
            if (current === undefined || (exercise.weightLb ?? -1) > (current.weightLb ?? -1)) {
                best.set(key, {
                    name: exercise.name, planId: plan.id, planName: plan.name, startedOn: plan.startedOn,
                    sets: exercise.sets, reps: exercise.reps, weightLb: exercise.weightLb,
                })
            }
        }
        for (const [key, {name, ...point}] of best) {
            const entry = series.get(key) ?? {key, name, points: []}
            entry.name = name
            entry.points.push(point)
            series.set(key, entry)
        }
    }
    return [...series.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
