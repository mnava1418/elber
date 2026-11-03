import env from '../../config/env.js'
import type { Skill } from '../../shared/skills/skill.js'
import ReportBugUseCase from './application/report-bug.use-case.js'
import GitHubIssueTracker from './infrastructure/github-issue-tracker.js'
import { buildReportBugTool } from './presentation/bugs.skill.js'

// Public entry point of the bugs skill: the owner tells Elber about a bug in
// Elber and it files it as an issue in the repository.
export type BugsModule = Skill

const createBugsModule = (): BugsModule => {
    // To file bugs somewhere else, swap this adapter for another IssueTracker.
    const reportBug = new ReportBugUseCase(new GitHubIssueTracker(env.GITHUB_TOKEN, env.GITHUB_REPO), env.MEMORY_OWNER_UID)

    return {
        tools: [buildReportBugTool(reportBug)],
    }
}

export default createBugsModule
