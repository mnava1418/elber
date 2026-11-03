import { toIssue, type BugReport, type CreatedIssue } from '../domain/issue.js'
import type { IssueTracker } from '../domain/issue-tracker.port.js'

// The model reads the error and tells the user they can't file bugs.
export type ReportBugResult = CreatedIssue | {error: 'BUG_REPORTS_UNAVAILABLE'}

// Files a bug in Elber's repository. Only its owner can: anyone else who signs
// in would otherwise open issues in their name.
class ReportBugUseCase {
    constructor(private readonly tracker: IssueTracker, private readonly ownerUid: string) {}

    execute = async (report: BugReport, uid: string, signal: AbortSignal): Promise<ReportBugResult> => {
        if (uid !== this.ownerUid) return {error: 'BUG_REPORTS_UNAVAILABLE'}
        return await this.tracker.create(toIssue(report), signal)
    }
}

export default ReportBugUseCase
