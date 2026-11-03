// Data of the 'issue' widget. Copy of CreatedIssue in
// backEnd/src/modules/bugs/domain/issue.ts: change both together.
export interface CreatedIssue {
  number: number
  title: string
  url: string
  labels: string[]
}
