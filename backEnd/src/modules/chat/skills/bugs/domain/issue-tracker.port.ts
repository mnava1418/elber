import type { CreatedIssue, NewIssue } from './issue.js'

// Port: where bugs are filed. Each tracker (GitHub...) is an adapter in
// infrastructure/ implementing it.
export interface IssueTracker {
    create(issue: NewIssue, signal: AbortSignal): Promise<CreatedIssue>
}
