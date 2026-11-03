import { describe, expect, it } from 'vitest'
import { toIssue, type BugReport } from '../../../../src/modules/bugs/domain/issue.js'

const REPORT: BugReport = {
    title: ' Weather card shows UTC times ',
    summary: 'The hourly forecast is two hours off.',
    steps: ['Ask Elber for the weather in Madrid', 'Look at the next hours'],
    expected: 'Madrid\'s local time.',
    actual: 'UTC times.',
    area: 'web',
}

describe('toIssue', () => {
    it('writes the report as Markdown sections, labelled by area', () => {
        expect(toIssue({...REPORT, environment: 'Chrome on macOS'})).toEqual({
            title: 'Weather card shows UTC times',
            body: '## Summary\nThe hourly forecast is two hours off.\n\n'
                + '## Steps to reproduce\n1. Ask Elber for the weather in Madrid\n2. Look at the next hours\n\n'
                + '## Expected\nMadrid\'s local time.\n\n'
                + '## Actual\nUTC times.\n\n'
                + '## Environment\nChrome on macOS\n\n'
                + '---\n_Reported through Elber._',
            labels: ['bug', 'web'],
        })
    })

    it('leaves out empty optional sections', () => {
        const {body} = toIssue({...REPORT, environment: '  ', notes: undefined})

        expect(body).not.toContain('## Environment')
        expect(body).not.toContain('## Notes')
    })

    it('labels only as a bug when the area is unknown', () => {
        expect(toIssue({...REPORT, area: 'unknown'}).labels).toEqual(['bug'])
    })
})
