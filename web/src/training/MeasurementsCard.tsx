import { useState } from 'react'
import { Button, Card } from '../components'
import { TrashIcon } from '../chat/icons'
import type { BodyMeasurement, MeasurementDraft } from './api'
import { toNumber } from './form'
import { MEASURES, type MeasureKey } from './measures'
import { shortDate } from './plan'

type Form = { date: string } & Record<MeasureKey, string>

const emptyForm = (today: string): Form => ({
  date: today, weightKg: '', bodyFatPct: '', waistCm: '', hipCm: '', chestCm: '', armCm: '', thighCm: '',
})

// Empty fields go as null: the user measures what they can.
const toDraft = (form: Form): MeasurementDraft => ({
  date: form.date,
  weightKg: toNumber(form.weightKg) ?? 0,
  bodyFatPct: toNumber(form.bodyFatPct),
  waistCm: toNumber(form.waistCm),
  hipCm: toNumber(form.hipCm),
  chestCm: toNumber(form.chestCm),
  armCm: toNumber(form.armCm),
  thighCm: toNumber(form.thighCm),
})

interface Props {
  // Oldest first.
  measurements: BodyMeasurement[]
  due: boolean
  today: string
  busy: boolean
  onAdd: (draft: MeasurementDraft) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

// Body measurements: added any day, with a reminder once a month has passed.
export function MeasurementsCard({ measurements, due, today, busy, onAdd, onDelete }: Props) {
  const [form, setForm] = useState<Form | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const last = measurements.at(-1) ?? null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (form && (await onAdd(toDraft(form)))) setForm(null)
  }

  return (
    <Card className="tr-card tr-measures">
      <span className="tr-kicker">Medidas</span>

      {due && !form && (
        <p className="tr-reminder" role="status">
          {last ? `Ya pasó un mes desde tus últimas medidas (${shortDate(last.date, true)}). ¿Te mides hoy?` : 'Aún no tienes medidas. Agrega las primeras para ver tu progreso.'}
        </p>
      )}

      {form ? (
        <form className="tr-editor" onSubmit={submit}>
          <div className="tr-form-grid">
            <label className="tr-field">
              <span>Fecha</span>
              <input type="date" required max={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            {MEASURES.map(({ key, label, unit }) => (
              <label key={key} className="tr-field">
                <span>{label} ({unit}){key === 'weightKg' ? '' : ' · opcional'}</span>
                <input
                  inputMode="decimal"
                  required={key === 'weightKg'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <p className="tr-muted">Brazo y muslo, del lado dominante.</p>
          <footer className="tr-form-actions">
            <Button type="button" variant="ghost" className="tr-btn-sm" disabled={busy} onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button type="submit" className="tr-btn-sm" disabled={busy}>
              Guardar medidas
            </Button>
          </footer>
        </form>
      ) : (
        <div className="tr-card-actions">
          <Button variant={due ? 'primary' : 'ghost'} className="tr-btn-sm" onClick={() => setForm(emptyForm(today))}>
            Agregar medidas
          </Button>
        </div>
      )}

      {measurements.length > 0 && (
        <div className="tr-table-wrap">
          <table className="tr-table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                {MEASURES.map(({ key, label, unit }) => <th key={key} scope="col">{label} <span className="tr-unit">{unit}</span></th>)}
                <th scope="col"><span className="tr-sr">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {[...measurements].reverse().map((m) => (
                <tr key={m.id}>
                  <th scope="row">{shortDate(m.date, true)}</th>
                  {MEASURES.map(({ key }) => <td key={key}>{m[key] ?? '—'}</td>)}
                  <td className="tr-table-actions">
                    {deleting === m.id ? (
                      <span className="tr-inline-confirm">
                        <button type="button" className="tr-link" onClick={() => setDeleting(null)}>No</button>
                        <button type="button" className="tr-link tr-link--danger" disabled={busy} onClick={() => onDelete(m.id).then(() => setDeleting(null))}>
                          Borrar
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="tr-icon-btn" aria-label={`Borrar medidas del ${shortDate(m.date, true)}`} onClick={() => setDeleting(m.id)}>
                        <TrashIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
