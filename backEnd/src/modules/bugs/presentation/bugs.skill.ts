import { z } from 'zod'
import { defineTool } from '../../../shared/skills/skill.js'
import type ReportBugUseCase from '../application/report-bug.use-case.js'

const text = z.string().trim().min(1).max(2000)

// Inbound adapter: what the assistant sees of the bugs module.
export const buildReportBugTool = (reportBug: ReportBugUseCase) => defineTool({
    name: 'report_bug',
    description: 'Files a bug in Elber itself (this app) as a GitHub issue. Call it only after asking the user what '
        + 'you need, showing them the draft and getting their OK; never to try out or guess a report. '
        + 'Write every field in English, even if the user speaks another language. '
        + 'The user sees the created issue as a card with its link.',
    input: {
        title: z.string().trim().min(1).max(120).describe('Short and specific, e.g. "Weather card shows UTC times".'),
        summary: text.describe('What goes wrong, in one or two sentences.'),
        steps: z.array(z.string().trim().min(1).max(500)).min(1).max(20).describe('Steps to reproduce it, in order.'),
        expected: text.describe('What should have happened.'),
        actual: text.describe('What happened instead, with any error message as the user saw it.'),
        area: z.enum(['backend', 'web', 'unknown']).describe(
            'web for the interface (what the user sees or clicks), backend for Elber\'s answers, tools and data; '
            + 'unknown if it isn\'t clear.',
        ),
        environment: text.optional().describe('Browser, device, since when it happens...'),
        notes: text.optional().describe('Anything else that helps: how often it happens, workarounds...'),
    },
    run: async (input, {uid, signal, show}) => {
        const result = await reportBug.execute(input, uid, signal)
        if (!('error' in result)) show({type: 'issue', data: result})
        return result
    },
})
