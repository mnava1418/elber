import type { CreatedIssue, NewIssue } from '../domain/issue.js'
import type { IssueTracker } from '../domain/issue-tracker.port.js'

const BASE_URL = 'https://api.github.com'
const TIMEOUT_MS = 10_000

// Only the fields used. https://docs.github.com/en/rest/issues/issues#create-an-issue
interface GitHubIssue {
    number: number
    title: string
    html_url: string
    labels: {name: string}[]
}

// Adapter: GitHub Issues through the REST API. The token is a fine-grained PAT
// limited to the repository with Issues: write. Labels that don't exist yet
// are created by GitHub.
class GitHubIssueTracker implements IssueTracker {
    // repo as "owner/name".
    constructor(private readonly token: string, private readonly repo: string) {}

    create = async (issue: NewIssue, signal: AbortSignal): Promise<CreatedIssue> => {
        const response = await fetch(`${BASE_URL}/repos/${this.repo}/issues`, {
            method: 'POST',
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
            body: JSON.stringify(issue),
            signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
        })
        if (!response.ok) {
            throw new Error(`GitHub issue creation in ${this.repo} failed: ${response.status} ${await response.text()}`)
        }
        const created = await response.json() as GitHubIssue
        return {
            number: created.number,
            title: created.title,
            url: created.html_url,
            labels: created.labels.map((label) => label.name),
        }
    }
}

export default GitHubIssueTracker
