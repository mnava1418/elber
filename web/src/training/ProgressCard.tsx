import { useState } from 'react'
import { Card } from '../components'
import type { TrainingProgress } from './api'
import { LineChart, type ChartPoint } from './LineChart'
import { MEASURES } from './measures'
import { daysBetween, shortDate } from './plan'

// Each exercise's target weight from plan to plan, and each body measurement
// over time. One series per chart, picked from a list.
export function ProgressCard({ progress }: { progress: TrainingProgress }) {
  // Bodyweight exercises have no weight to chart.
  const exercises = progress.exercises.filter((e) => e.points.some((p) => p.weightKg !== null))
  const measures = MEASURES.filter(({ key }) => progress.measurements.some((m) => m[key] !== null))
  const [exerciseKey, setExerciseKey] = useState(exercises[0]?.key ?? '')
  const [measureKey, setMeasureKey] = useState(measures[0]?.key ?? 'weightKg')

  const exercise = exercises.find((e) => e.key === exerciseKey) ?? exercises[0]
  // Plans are evenly spaced: what matters is one plan after another.
  const exercisePoints: ChartPoint[] = (exercise?.points ?? [])
    .filter((p) => p.weightKg !== null)
    .map((p, i) => ({ x: i, value: p.weightKg!, label: p.planName, detail: `${p.sets}×${p.reps} · desde el ${shortDate(p.startedOn, true)}` }))

  const measure = measures.find((m) => m.key === measureKey) ?? measures[0]
  const first = progress.measurements[0]?.date
  // Measurements are spaced by date: a gap of two months looks like one.
  const measurePoints: ChartPoint[] = measure
    ? progress.measurements
        .filter((m) => m[measure.key] !== null)
        .map((m) => ({ x: daysBetween(first!, m.date), value: m[measure.key]!, label: shortDate(m.date) }))
    : []

  return (
    <Card className="tr-card tr-progress">
      <span className="tr-kicker">Progreso</span>
      <div className="tr-progress-grid">
        <section className="tr-progress-block" aria-label="Progreso por ejercicio">
          <header className="tr-progress-head">
            <h2>Peso objetivo por plan</h2>
            {exercises.length > 0 && (
              <select aria-label="Ejercicio" value={exercise?.key} onChange={(e) => setExerciseKey(e.target.value)}>
                {exercises.map((e) => <option key={e.key} value={e.key}>{e.name}</option>)}
              </select>
            )}
          </header>
          {exercisePoints.length > 0 ? (
            <>
              <LineChart points={exercisePoints} unit="kg" name={exercise!.name} />
              {exercisePoints.length === 1 && <p className="tr-muted">Con tu siguiente plan verás aquí cómo sube.</p>}
            </>
          ) : (
            <p className="tr-muted">Cuando tus planes tengan ejercicios con peso, aquí verás cómo cambia de un plan a otro.</p>
          )}
        </section>

        <section className="tr-progress-block" aria-label="Progreso de medidas">
          <header className="tr-progress-head">
            <h2>Medidas</h2>
            {measures.length > 0 && (
              <select aria-label="Medida" value={measure?.key} onChange={(e) => setMeasureKey(e.target.value as typeof measureKey)}>
                {measures.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            )}
          </header>
          {measurePoints.length > 0 ? (
            <LineChart points={measurePoints} unit={measure!.unit} name={measure!.label} />
          ) : (
            <p className="tr-muted">Agrega tus medidas para ver su gráfica.</p>
          )}
        </section>
      </div>
    </Card>
  )
}
