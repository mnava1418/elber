import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GitHubIssueTracker from '../../../../../../src/modules/chat/skills/bugs/infrastructure/github-issue-tracker.js'

const TOKEN = 'test-token'
const ISSUE = {title: 'Send button stays disabled', body: '## Summary\nIt stays disabled.', labels: ['bug', 'web']}

describe('GitHubIssueTracker', () => {
    const fetchMock = vi.fn<typeof fetch>()
    const signal = new AbortController().signal
    let tracker: GitHubIssueTracker

    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock)
        tracker = new GitHubIssueTracker(TOKEN, 'owner/repo')
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.resetAllMocks()
    })

    const respond = (body: unknown, status = 201) =>
        fetchMock.mockResolvedValue(new Response(JSON.stringify(body), {status}))

    it('creates the issue in the repository and returns its link', async () => {
        respond({number: 7, title: ISSUE.title, html_url: 'https://github.com/owner/repo/issues/7', labels: [{name: 'bug'}, {name: 'web'}]})

        const created = await tracker.create(ISSUE, signal)

        const [url, init] = fetchMock.mock.calls[0]!
        expect(url).toBe('https://api.github.com/repos/owner/repo/issues')
        expect(init?.method).toBe('POST')
        expect(init?.headers).toMatchObject({Authorization: `Bearer ${TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28'})
        expect(JSON.parse(init?.body as string)).toEqual(ISSUE)
        expect(created).toEqual({number: 7, title: ISSUE.title, url: 'https://github.com/owner/repo/issues/7', labels: ['bug', 'web']})
    })

    it('throws on an error response without leaking the token', async () => {
        respond({message: 'Bad credentials'}, 401)

        const error = await tracker.create(ISSUE, signal).catch((e: Error) => e)

        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('401')
        expect((error as Error).message).not.toContain(TOKEN)
    })
})
