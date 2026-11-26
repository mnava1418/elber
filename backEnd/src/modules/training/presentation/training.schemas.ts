import { z } from 'zod'
import { BadRequestError } from '../../../shared/http/errors.js'
import { LEVELS, PLACES } from '../domain/profile.js'

// The shapes the API accepts. They only check types: the rules (ranges,
// lengths, dates) are the domain's, so Elber's tools and the page share them.
// Optional text and numbers may be left out, meaning null.

const optionalText = z.string().nullable().default(null)
const optionalNumber = z.number().nullable().default(null)

const exercise = z.object({
    name: z.string(),
    sets: z.number(),
    reps: z.string(),
    weightLb: optionalNumber,
    restSeconds: optionalNumber,
    notes: optionalText,
})

export const planDraftSchema = z.object({
    name: z.string(),
    goal: optionalText,
    notes: optionalText,
    durationWeeks: z.number(),
    daysPerWeek: z.number(),
    routines: z.array(z.object({
        // A routine the plan already has keeps its id; leave it out for a new one.
        id: z.string().optional(),
        name: z.string(),
        exercises: z.array(exercise),
    })),
})

export const createPlanSchema = planDraftSchema.extend({
    // The user's today, from their device.
    startedOn: z.string(),
})

export const closePlanSchema = z.object({closedOn: z.string()})

// Starting the ready plan: the user's today, and whether they agreed to
// close the active plan to start this one.
export const startReadyPlanSchema = z.object({today: z.string(), closeActive: z.boolean().default(false)})

// Every field is optional: what is left out stays as it is, null clears it.
export const profileChangesSchema = z.object({
    goal: z.string().nullable(),
    level: z.enum(LEVELS).nullable(),
    daysPerWeek: z.number().nullable(),
    minutesPerSession: z.number().nullable(),
    place: z.enum(PLACES).nullable(),
    equipment: z.string().nullable(),
    injuries: z.string().nullable(),
    preferences: z.string().nullable(),
    heightCm: z.number().nullable(),
}).partial().strict()

export const markSessionSchema = z.object({
    routineId: z.string().nullable().default(null),
    today: z.string(),
})

export const sessionsQuerySchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
})

export const measurementSchema = z.object({
    date: z.string(),
    weightKg: z.number(),
    bodyFatPct: optionalNumber,
    waistCm: optionalNumber,
    hipCm: optionalNumber,
    chestCm: optionalNumber,
    armCm: optionalNumber,
    thighCm: optionalNumber,
})

export const todayQuerySchema = z.object({today: z.string()})

// The page's first load: today, and from which day the calendar starts.
export const pageQuerySchema = z.object({today: z.string(), from: z.string()})

// Parses or answers 400 naming the first field that is wrong, so the page
// (or whoever calls) knows what to fix.
export const parse = <T extends z.ZodType>(schema: T, data: unknown, code = 'INVALID_BODY'): z.infer<T> => {
    const result = schema.safeParse(data)
    if (result.success) return result.data
    const issue = result.error.issues[0]
    const field = issue && issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    throw new BadRequestError(`${field}${issue?.message ?? 'Invalid data'}`, code)
}
