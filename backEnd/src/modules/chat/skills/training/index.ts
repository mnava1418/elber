import { readPrompt } from '../../../../shared/prompts/read-prompt.js'
import type { Skill } from '../../domain/skill.js'
import CoachUseCase from './application/coach.use-case.js'
import type { TrainingCoach } from './domain/training-coach.port.js'
import { buildTrainingTools } from './presentation/training.skill.js'

export type { TrainingCoach } from './domain/training-coach.port.js'

// The coach's guide is long and only matters when building or changing a
// plan: a tool serves it on demand instead of the system prompt carrying it
// on every answer.
const COACHING_GUIDE = readPrompt(new URL('./infrastructure/coaching-guide.md', import.meta.url))

// Public entry point of the training skill (only the chat's index.ts imports
// it): Elber as the user's personal trainer. The data is the training
// module's: app.ts hands its coach to the chat, which passes it here.
// No context(uid): the tools load the profile and plan when needed, so other
// answers don't pay for them.
const createTrainingSkill = (coach: TrainingCoach): Skill => ({
    tools: buildTrainingTools(new CoachUseCase(coach, COACHING_GUIDE)),
})

export default createTrainingSkill
