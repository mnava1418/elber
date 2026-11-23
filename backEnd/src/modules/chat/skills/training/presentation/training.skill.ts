import { z } from 'zod'
import { defineTool, type SkillContext } from '../../../domain/skill.js'
import type CoachUseCase from '../application/coach.use-case.js'
import type { PlanResult } from '../application/coach.use-case.js'
import { LEVELS, PLACES, type CoachPlanDraft } from '../domain/training-coach.port.js'

// The shapes only: the ranges and lengths are the training module's rules,
// and when one is broken the model gets INVALID_DATA naming the field.
const exercise = z.object({
    name: z.string().describe('Reuse the exact name if it is in knownExercises (get_active_plan), e.g. "Sentadilla trasera".'),
    sets: z.number().int(),
    reps: z.string().describe('Per set: "8", "8-10", "30 s", "al fallo".'),
    weightKg: z.number().nullish().describe('Target weight in kg; leave it out for bodyweight exercises.'),
    restSeconds: z.number().int().nullish(),
    notes: z.string().nullish().describe('Technique cues or how to progress, short.'),
})

const plan = {
    name: z.string().describe('Short, e.g. "Fuerza base".'),
    goal: z.string().nullish(),
    notes: z.string().nullish().describe('How to progress week to week, deload, anything the whole plan needs.'),
    durationWeeks: z.number().int(),
    daysPerWeek: z.number().int().describe('Training days per week: the weekly target of the streak.'),
    routines: z.array(z.object({
        id: z.string().optional().describe('Keep the id of a routine the plan already has (update_plan). Leave it out for a new one.'),
        name: z.string().describe('"Día A: Pierna", "Día B: Empuje"...'),
        exercises: z.array(exercise),
    })).describe('Done in rotation, in this order: the ideal order for recovery.'),
}

type PlanInput = z.infer<z.ZodObject<typeof plan>>

// The model may leave optional fields out; the training data stores null.
const toDraft = (input: PlanInput): CoachPlanDraft => ({
    name: input.name,
    goal: input.goal ?? null,
    notes: input.notes ?? null,
    durationWeeks: input.durationWeeks,
    daysPerWeek: input.daysPerWeek,
    routines: input.routines.map(({id, name, exercises}) => ({
        ...(id === undefined ? {} : {id}),
        name,
        exercises: exercises.map((e) => ({
            name: e.name, sets: e.sets, reps: e.reps,
            weightKg: e.weightKg ?? null, restSeconds: e.restSeconds ?? null, notes: e.notes ?? null,
        })),
    })),
})

// A saved plan shows as a card; errors only go to the model.
const showPlan = (result: PlanResult, context: SkillContext) => {
    if (!('error' in result)) context.show({type: 'training_plan', data: result})
    return result
}

// Inbound adapter: what the assistant sees of the coach.
export const buildTrainingTools = (coach: CoachUseCase) => [
    defineTool({
        name: 'get_coaching_guide',
        description: 'How to coach the user and build or change a training plan. Read it before create_plan or update_plan '
            + '(once per conversation is enough) and follow it.',
        input: {},
        run: async () => coach.guide(),
    }),
    defineTool({
        name: 'get_training_profile',
        description: "The user's training profile: goal, level, days per week, minutes per session, where they train, "
            + 'equipment, injuries, preferences, height. Fields are null until known.',
        input: {},
        run: async (_input, {uid}) => coach.profile(uid),
    }),
    defineTool({
        name: 'update_training_profile',
        description: 'Saves what you learned about how the user trains. Send only the fields that changed; null clears one. '
            + 'Save it as you learn it, without asking first: it is what they told you.',
        input: {
            goal: z.string().nullish().describe('In their words: "bajar grasa y ganar fuerza".'),
            level: z.enum(LEVELS).nullish(),
            daysPerWeek: z.number().int().nullish(),
            minutesPerSession: z.number().int().nullish(),
            place: z.enum(PLACES).nullish().describe('mixed = both gym and home.'),
            equipment: z.string().nullish(),
            injuries: z.string().nullish().describe('Injuries or limitations, and what to avoid.'),
            preferences: z.string().nullish().describe('Exercises they like or dislike, schedule...'),
            heightCm: z.number().nullish(),
        },
        // Fields the model didn't send stay out, so they keep their value.
        run: async (input, {uid}) => coach.updateProfile(uid, Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined))),
    }),
    defineTool({
        name: 'get_active_plan',
        description: "The user's active training plan (null if there is none), with its routines and their ids, "
            + 'and knownExercises: the names of every exercise they have had in a plan.',
        input: {
            show: z.boolean().optional().describe('true when the user asked to see their plan: they see it as a card, '
                + 'so answer briefly instead of listing it. Leave it out when you only read it for yourself.'),
        },
        // Only on request: Elber also reads the plan before changing it, and a
        // card there would show the old version right before the new one.
        run: async ({show}, context) => {
            const result = await coach.activePlan(context.uid)
            if (show && result.plan) context.show({type: 'training_plan', data: result.plan})
            return result
        },
    }),
    defineTool({
        name: 'create_plan',
        description: 'Saves a new training plan, starting today. Only after the user approved the draft you showed them. '
            + 'PLAN_ALREADY_ACTIVE: they have to close the current plan first, in the training page (Entrenamiento); '
            + "you can't close it. INVALID_DATA: fix the field it names and try again. "
            + 'The user sees the saved plan as a card, so just confirm it in a sentence.',
        input: plan,
        run: async (input, context) => showPlan(await coach.createPlan(context.uid, toDraft(input)), context),
    }),
    defineTool({
        name: 'update_plan',
        description: 'Replaces the active plan with this version: send the whole plan, keeping the id of each routine '
            + 'that stays. Only after the user approved the change. NO_ACTIVE_PLAN: create one instead. '
            + 'The user sees the updated plan as a card, so just confirm it in a sentence.',
        input: plan,
        run: async (input, context) => showPlan(await coach.updatePlan(context.uid, toDraft(input)), context),
    }),
    defineTool({
        name: 'get_training_progress',
        description: 'How the user is doing: streak (weeks in a row meeting the weekly target), this week, the next routine '
            + 'in the rotation, the days trained in the last 4 weeks, each exercise from plan to plan and their body '
            + 'measurements. Read only: the user marks days and adds measurements in the training page, not with you.',
        input: {},
        run: async (_input, {uid}) => coach.progress(uid),
    }),
]
