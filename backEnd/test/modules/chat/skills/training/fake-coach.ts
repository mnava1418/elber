import { vi } from 'vitest'
import type { CoachPlan, CoachPlanDraft, TrainingCoach } from '../../../../../src/modules/chat/skills/training/domain/training-coach.port.js'

export const PROFILE = {
    goal: 'Fuerza', level: null, daysPerWeek: 3, minutesPerSession: null, place: null,
    equipment: null, injuries: null, preferences: null, heightCm: null,
}

export const DRAFT: CoachPlanDraft = {
    name: 'Fuerza base', goal: null, notes: null, durationWeeks: 4, daysPerWeek: 3,
    routines: [{name: 'Día A: Pierna', exercises: [{name: 'Sentadilla trasera', sets: 4, reps: '6', weightKg: 60, restSeconds: 150, notes: null}]}],
}

export const PLAN: CoachPlan = {
    id: 'p1', status: 'active', startedOn: '2026-11-20', closedOn: null, ...DRAFT,
    routines: [{id: 'a', ...DRAFT.routines[0]!}],
}

// The training module's coach, as mocks the tests program.
export const fakeCoach = () => ({
    getProfile: vi.fn<TrainingCoach['getProfile']>(async () => PROFILE),
    updateProfile: vi.fn<TrainingCoach['updateProfile']>(async () => PROFILE),
    getActivePlan: vi.fn<TrainingCoach['getActivePlan']>(async () => PLAN),
    createPlan: vi.fn<TrainingCoach['createPlan']>(async () => PLAN),
    updatePlan: vi.fn<TrainingCoach['updatePlan']>(async () => PLAN),
    getProgress: vi.fn<TrainingCoach['getProgress']>(async () => ({exercises: [{name: 'Sentadilla trasera'}, {name: 'Press de banca'}]})),
}) satisfies TrainingCoach
