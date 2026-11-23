import type { Widget } from '../../lib/socket'
import { IssueCard } from './IssueCard'
import type { TrainingPlan } from '../../training/plan'
import type { CreatedIssue } from './issue'
import { TrainingPlanCard } from './TrainingPlanCard'
import { WeatherCard } from './WeatherCard'
import type { WeatherReport } from './weather'

// What the tools show next to Elber's answer. A type this version of the app
// doesn't know (a newer backend) is left out.
export function Widgets({ widgets }: { widgets: Widget[] }) {
  return widgets.map((widget, i) => {
    switch (widget.type) {
      case 'weather':
        return <WeatherCard key={i} report={widget.data as WeatherReport} />
      case 'issue':
        return <IssueCard key={i} issue={widget.data as CreatedIssue} />
      case 'training_plan':
        return <TrainingPlanCard key={i} plan={widget.data as TrainingPlan} />
      default:
        return null
    }
  })
}
