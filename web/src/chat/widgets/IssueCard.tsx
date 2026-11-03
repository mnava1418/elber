import { BugIcon } from '../icons'
import type { CreatedIssue } from './issue'
import '../../styles/IssueCard.css'

export function IssueCard({ issue }: { issue: CreatedIssue }) {
  return (
    <section className="issue" aria-label={`Issue #${issue.number}`}>
      <header className="issue-head">
        <BugIcon width={16} height={16} className="issue-icon" />
        <span className="issue-kicker">Bug reportado</span>
        <span className="issue-number">#{issue.number}</span>
      </header>
      <p className="issue-title">{issue.title}</p>
      <footer className="issue-foot">
        <ul className="issue-labels" aria-label="Etiquetas">
          {issue.labels.map((label) => <li key={label}>{label}</li>)}
        </ul>
        {/* Opens in a new tab: the chat keeps its place. */}
        <a className="issue-link" href={issue.url} target="_blank" rel="noreferrer">
          Ver en GitHub
        </a>
      </footer>
    </section>
  )
}
