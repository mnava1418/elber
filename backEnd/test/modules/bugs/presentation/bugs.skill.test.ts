import { describe, expect, it, vi } from 'vitest'
import type { SkillContext } from '../../../../src/modules/chat/domain/skill.js'
import type ReportBugUseCase from '../../../../src/modules/bugs/application/report-bug.use-case.js'
import type { ReportBugResult } from '../../../../src/modules/bugs/application/report-bug.use-case.js'
import { buildReportBugTool } from '../../../../src/modules/bugs/presentation/bugs.skill.js'

const context = (): SkillContext => ({
    uid: 'owner-uid',
    conversationId: 'conv1',
    signal: new AbortController().signal,
    locate: async () => null,
    show: vi.fn(),
})

const INPUT = {
    title: 'Send button stays disabled',
    summary: 'After an error the send button never comes back.',
    steps: ['Send a message with the backend down'],
    expected: 'The button is enabled again.',
    actual: 'It stays disabled.',
    area: 'web' as const,
}

// Only execute() is used by the tool.
const toolReturning = (result: ReportBugResult) =>
    buildReportBugTool({execute: async () => result} as unknown as ReportBugUseCase)

describe('report_bug tool', () => {
    it('shows the created issue as a card and gives it to the model', async () => {
        const issue = {number: 7, title: INPUT.title, url: 'https://github.com/o/r/issues/7', labels: ['bug', 'web']}
        const ctx = context()

        const result = await toolReturning(issue).run(INPUT, ctx)

        expect(result).toBe(issue)
        expect(ctx.show).toHaveBeenCalledExactlyOnceWith({type: 'issue', data: issue})
    })

    it('shows nothing when no issue was filed', async () => {
        const ctx = context()

        const result = await toolReturning({error: 'BUG_REPORTS_UNAVAILABLE'}).run(INPUT, ctx)

        expect(result).toEqual({error: 'BUG_REPORTS_UNAVAILABLE'})
        expect(ctx.show).not.toHaveBeenCalled()
    })
})
