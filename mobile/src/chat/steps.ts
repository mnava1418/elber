// Copy of the labels and summary in web/src/chat/ElberMessage.tsx: change both together.
// Kept apart from the components so the tests don't load fonts.
import type { ToolKind, ToolStep } from './types'

export const LABEL: Record<ToolKind, string> = {
  search: 'Buscando en la web',
  read: 'Leyendo una página',
  weather: 'Consultando el clima',
  remember: 'Recordando',
  forget: 'Olvidando',
  add_todo: 'Agregando pendiente',
  complete_todo: 'Completando',
  list_todos: 'Revisando tus pendientes',
  save_note: 'Guardando nota',
  search_notes: 'Buscando en tus notas',
  read_note: 'Leyendo nota',
  update_note: 'Actualizando nota',
  link_notes: 'Enlazando notas',
  report_bug: 'Reportando el bug',
  save_entry: 'Guardando en tu diario',
  read_month: 'Leyendo tu diario',
  list_months: 'Revisando tu diario',
  get_coaching_guide: 'Repasando cómo entrenarte',
  get_training_profile: 'Revisando tu perfil de entrenamiento',
  update_training_profile: 'Actualizando tu perfil de entrenamiento',
  get_plans: 'Revisando tus planes',
  create_plan: 'Guardando tu plan',
  update_plan: 'Actualizando tu plan',
  get_training_progress: 'Revisando tu progreso',
}

// "2 pasos · Buscó en la web y leyó 1 página": what Elber did, once it answered.
export function stepsSummary(steps: ToolStep[]) {
  const count = (kind: ToolKind) => steps.filter((s) => s.kind === kind).length
  const searches = count('search')
  const reads = count('read')
  const weather = count('weather')
  const remembered = count('remember')
  const forgotten = count('forget')
  const added = count('add_todo')
  const completed = count('complete_todo')
  const listed = count('list_todos') > 0
  const saved = count('save_note')
  const searchedNotes = count('search_notes') > 0
  const readNotes = count('read_note')
  const updated = count('update_note')
  const linked = count('link_notes')
  const reported = count('report_bug')
  const savedEntry = count('save_entry') > 0
  const readMonths = count('read_month')
  const listedMonths = count('list_months') > 0
  // The coach's reads are one idea for the user: Elber looked at their training.
  const readTraining = steps.some((s) => ['get_coaching_guide', 'get_training_profile', 'get_plans', 'get_training_progress'].includes(s.kind))
  const updatedProfile = count('update_training_profile') > 0
  const createdPlan = count('create_plan') > 0
  const updatedPlan = count('update_plan') > 0
  const parts: string[] = []
  if (weather) parts.push(weather === 1 ? 'consultó el clima' : `consultó el clima ${weather} veces`)
  if (searches) parts.push(searches === 1 ? 'buscó en la web' : `hizo ${searches} búsquedas`)
  if (reads) parts.push(reads === 1 ? 'leyó 1 página' : `leyó ${reads} páginas`)
  if (remembered) parts.push(remembered === 1 ? 'guardó 1 dato' : `guardó ${remembered} datos`)
  if (forgotten) parts.push(forgotten === 1 ? 'olvidó 1 dato' : `olvidó ${forgotten} datos`)
  if (listed) parts.push('revisó tus pendientes')
  if (added) parts.push(added === 1 ? 'agregó 1 pendiente' : `agregó ${added} pendientes`)
  if (completed) parts.push(completed === 1 ? 'completó 1 pendiente' : `completó ${completed} pendientes`)
  if (searchedNotes) parts.push('buscó en tus notas')
  if (readNotes) parts.push(readNotes === 1 ? 'leyó 1 nota' : `leyó ${readNotes} notas`)
  if (saved) parts.push(saved === 1 ? 'guardó 1 nota' : `guardó ${saved} notas`)
  if (updated) parts.push(updated === 1 ? 'actualizó 1 nota' : `actualizó ${updated} notas`)
  if (linked) parts.push(linked === 1 ? 'enlazó 2 notas' : `hizo ${linked} enlaces`)
  if (reported) parts.push(reported === 1 ? 'reportó 1 bug' : `reportó ${reported} bugs`)
  if (listedMonths) parts.push('revisó tu diario')
  if (readMonths) parts.push(readMonths === 1 ? 'leyó 1 mes de tu diario' : `leyó ${readMonths} meses de tu diario`)
  if (savedEntry) parts.push('guardó tu diario')
  if (readTraining) parts.push('revisó tu entrenamiento')
  if (updatedProfile) parts.push('actualizó tu perfil de entrenamiento')
  if (createdPlan) parts.push('guardó tu plan')
  if (updatedPlan) parts.push('actualizó tu plan')
  const desc = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}` : parts.join('')
  return `${steps.length === 1 ? '1 paso' : `${steps.length} pasos`} · ${desc.charAt(0).toUpperCase()}${desc.slice(1)}`
}
