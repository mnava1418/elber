// Where in Elber the bug shows up. Each known area becomes a label.
export type Area = 'backend' | 'web' | 'unknown'

// What Elber learned about the bug by asking the user.
export interface BugReport {
    title: string
    summary: string
    steps: string[]
    expected: string
    actual: string
    area: Area
    // Browser, device, since when it happens...
    environment?: string
    notes?: string
}

export interface NewIssue {
    title: string
    // Markdown.
    body: string
    labels: string[]
}

export interface CreatedIssue {
    number: number
    title: string
    url: string
    labels: string[]
}

// The same sections in every issue, so they read alike and nothing is left out.
export const toIssue = (report: BugReport): NewIssue => {
    const sections = [
        ['Summary', report.summary],
        ['Steps to reproduce', report.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')],
        ['Expected', report.expected],
        ['Actual', report.actual],
        ['Environment', report.environment],
        ['Notes', report.notes],
    ].filter((section): section is [string, string] => Boolean(section[1]?.trim()))

    return {
        title: report.title.trim(),
        body: sections.map(([heading, text]) => `## ${heading}\n${text.trim()}`).join('\n\n')
            + '\n\n---\n_Reported through Elber._',
        labels: report.area === 'unknown' ? ['bug'] : ['bug', report.area],
    }
}
