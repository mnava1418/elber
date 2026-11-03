import { describe, expect, it, vi } from 'vitest'
import ReportBugUseCase from '../../../../src/modules/bugs/application/report-bug.use-case.js'
import type { BugReport, CreatedIssue } from '../../../../src/modules/bugs/domain/issue.js'
import type { IssueTracker } from '../../../../src/modules/bugs/domain/issue-tracker.port.js'

const OWNER = 'owner-uid'

const REPORT: BugReport = {
    title: 'Send button stays disabled',
    summary: 'After an error the send button never comes back.',
    steps: ['Stop the backend', 'Send a message'],
    expected: 'The button is enabled again.',
    actual: 'It stays disabled until reloading.',
    area: 'web',
}

const CREATED: CreatedIssue = {number: 7, title: REPORT.title, url: 'https://github.com/o/r/issues/7', labels: ['bug', 'web']}

describe('ReportBugUseCase', () => {
    const signal = new AbortController().signal

    const setup = () => {
        const tracker = {create: vi.fn<IssueTracker['create']>(async () => CREATED)}
        return {tracker, useCase: new ReportBugUseCase(tracker, OWNER)}
    }

    it('files the owner\'s report as an issue', async () => {
        const {tracker, useCase} = setup()

        const result = await useCase.execute(REPORT, OWNER, signal)

        expect(result).toEqual(CREATED)
        expect(tracker.create).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({title: REPORT.title, labels: ['bug', 'web']}),
            signal,
        )
    })

    it('files nothing for anyone else', async () => {
        const {tracker, useCase} = setup()

        const result = await useCase.execute(REPORT, 'someone-else', signal)

        expect(result).toEqual({error: 'BUG_REPORTS_UNAVAILABLE'})
        expect(tracker.create).not.toHaveBeenCalled()
    })
})
