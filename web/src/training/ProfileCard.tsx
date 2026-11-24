import { useState } from 'react'
import { Button, Card } from '../components'
import { LEVELS, PLACES, type TrainingProfile } from './api'
import { numberText, toNumber, toText } from './form'

const LEVEL_LABEL: Record<(typeof LEVELS)[number], string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }
const PLACE_LABEL: Record<(typeof PLACES)[number], string> = { gym: 'Gimnasio', home: 'Casa', mixed: 'Gimnasio y casa' }

const toForm = (p: TrainingProfile) => ({
  goal: p.goal ?? '',
  level: p.level ?? '',
  daysPerWeek: numberText(p.daysPerWeek),
  minutesPerSession: numberText(p.minutesPerSession),
  place: p.place ?? '',
  equipment: p.equipment ?? '',
  injuries: p.injuries ?? '',
  preferences: p.preferences ?? '',
  heightCm: numberText(p.heightCm),
})

type Form = ReturnType<typeof toForm>

// Every field goes: an empty one clears it (null), as the user left it.
const toChanges = (f: Form): TrainingProfile => ({
  goal: toText(f.goal),
  level: (f.level || null) as TrainingProfile['level'],
  daysPerWeek: toNumber(f.daysPerWeek),
  minutesPerSession: toNumber(f.minutesPerSession),
  place: (f.place || null) as TrainingProfile['place'],
  equipment: toText(f.equipment),
  injuries: toText(f.injuries),
  preferences: toText(f.preferences),
  heightCm: toNumber(f.heightCm),
})

interface Props {
  profile: TrainingProfile
  busy: boolean
  onSave: (changes: TrainingProfile) => Promise<boolean>
}

// What Elber knows to coach the user. He fills it in while talking; here
// the user sees it and corrects it.
export function ProfileCard({ profile, busy, onSave }: Props) {
  const [form, setForm] = useState<Form | null>(null)

  if (form) {
    const set = (changes: Partial<Form>) => setForm({ ...form, ...changes })
    const submit = async (event: React.FormEvent) => {
      event.preventDefault()
      if (await onSave(toChanges(form))) setForm(null)
    }
    return (
      <Card className="tr-card tr-profile">
        <span className="tr-kicker">Editar perfil</span>
        <form className="tr-editor" onSubmit={submit}>
          <div className="tr-form-grid">
            <label className="tr-field tr-field--wide">
              <span>Objetivo</span>
              <input maxLength={500} value={form.goal} onChange={(e) => set({ goal: e.target.value })} />
            </label>
            <label className="tr-field">
              <span>Nivel</span>
              <select value={form.level} onChange={(e) => set({ level: e.target.value })}>
                <option value="">Sin definir</option>
                {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
              </select>
            </label>
            <label className="tr-field">
              <span>Dónde entrenas</span>
              <select value={form.place} onChange={(e) => set({ place: e.target.value })}>
                <option value="">Sin definir</option>
                {PLACES.map((p) => <option key={p} value={p}>{PLACE_LABEL[p]}</option>)}
              </select>
            </label>
            <label className="tr-field">
              <span>Días por semana</span>
              <input inputMode="numeric" value={form.daysPerWeek} onChange={(e) => set({ daysPerWeek: e.target.value })} />
            </label>
            <label className="tr-field">
              <span>Minutos por sesión</span>
              <input inputMode="numeric" value={form.minutesPerSession} onChange={(e) => set({ minutesPerSession: e.target.value })} />
            </label>
            <label className="tr-field">
              <span>Estatura (cm)</span>
              <input inputMode="decimal" value={form.heightCm} onChange={(e) => set({ heightCm: e.target.value })} />
            </label>
            <label className="tr-field tr-field--wide">
              <span>Equipo</span>
              <input maxLength={500} value={form.equipment} onChange={(e) => set({ equipment: e.target.value })} />
            </label>
            <label className="tr-field tr-field--wide">
              <span>Lesiones o limitaciones</span>
              <textarea rows={2} maxLength={500} value={form.injuries} onChange={(e) => set({ injuries: e.target.value })} />
            </label>
            <label className="tr-field tr-field--wide">
              <span>Preferencias</span>
              <textarea rows={2} maxLength={500} value={form.preferences} onChange={(e) => set({ preferences: e.target.value })} />
            </label>
          </div>
          <footer className="tr-form-actions">
            <Button type="button" variant="ghost" className="tr-btn-sm" disabled={busy} onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button type="submit" className="tr-btn-sm" disabled={busy}>
              Guardar perfil
            </Button>
          </footer>
        </form>
      </Card>
    )
  }

  const rows: [string, string | null][] = [
    ['Objetivo', profile.goal],
    ['Nivel', profile.level && LEVEL_LABEL[profile.level]],
    ['Días por semana', numberText(profile.daysPerWeek) || null],
    ['Minutos por sesión', numberText(profile.minutesPerSession) || null],
    ['Dónde entrenas', profile.place && PLACE_LABEL[profile.place]],
    ['Equipo', profile.equipment],
    ['Lesiones', profile.injuries],
    ['Preferencias', profile.preferences],
    ['Estatura', profile.heightCm === null ? null : `${profile.heightCm} cm`],
  ]
  return (
    <Card className="tr-card tr-profile">
      <span className="tr-kicker">Tu perfil</span>
      <dl className="tr-profile-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={value ? undefined : 'tr-unknown'}>{value ?? 'Sin definir'}</dd>
          </div>
        ))}
      </dl>
      <div className="tr-card-actions">
        <Button variant="ghost" className="tr-btn-sm" onClick={() => setForm(toForm(profile))}>
          Editar perfil
        </Button>
      </div>
    </Card>
  )
}
