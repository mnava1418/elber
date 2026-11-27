import type { TrainingCardData } from './useInicio'

// The training card's title and line, apart from the component so they can be tested.
export function headline(data: TrainingCardData) {
  if (data.trainedToday) return 'Hoy ya entrenaste'
  if (data.nextRoutine) return `Hoy toca: ${data.nextRoutine}`
  return 'Sin plan activo'
}

export function detail(data: TrainingCardData) {
  if (data.trainedToday) return data.trainedToday.routineName ? `${data.trainedToday.routineName}. ¡Bien hecho!` : '¡Bien hecho!'
  if (data.planName) return `De tu plan ${data.planName}.`
  return 'Pídele a Elber en el chat que te prepare un plan.'
}
