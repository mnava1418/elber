import type { BodyMeasurement } from './api'

export type MeasureKey = Exclude<keyof BodyMeasurement, 'id' | 'date'>

// Each measurement, in the order the page shows them. Only the weight is required.
export const MEASURES: { key: MeasureKey; label: string; unit: string }[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg' },
  { key: 'bodyFatPct', label: 'Grasa corporal', unit: '%' },
  { key: 'waistCm', label: 'Cintura', unit: 'cm' },
  { key: 'hipCm', label: 'Cadera', unit: 'cm' },
  { key: 'chestCm', label: 'Pecho', unit: 'cm' },
  { key: 'armCm', label: 'Brazo', unit: 'cm' },
  { key: 'thighCm', label: 'Muslo', unit: 'cm' },
]
