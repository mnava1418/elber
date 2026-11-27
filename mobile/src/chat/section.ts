// A section of the app with its own chat: its own agent and conversations in
// the backend (its API path), and its own screen here. Copy of
// web/src/chat/section.ts; the socket transport comes in with the chat (phase 5).
export interface ChatSection {
  // Route of its screen, e.g. /chat/<id>.
  path: '/chat' | '/diario'
  // Backend API path of its history, e.g. /chat/conversations.
  api: string
  // One conversation per day (the diary): the screen opens today's and there
  // is no "new conversation".
  daily: boolean
  greeting: string
  intro: string
  suggestions: string[]
}

export const CHAT: ChatSection = {
  path: '/chat',
  api: '/chat',
  daily: false,
  greeting: '¿En qué te ayudo hoy?',
  intro: 'Pregúntame lo que quieras. Puedo buscar en la web, leer páginas y ayudarte a organizar tu día.',
  suggestions: ['Dame el clima actual en Nueva York', '¿Que pendientes tengo?', '¿Cuando juega el Real Madrid?'],
}

export const DIARY: ChatSection = {
  path: '/diario',
  api: '/diary',
  daily: true,
  greeting: '¿Cómo te fue hoy?',
  intro: 'Platícame de tu día. Cuando terminemos, te propongo un resumen para tu diario.',
  suggestions: ['Hoy fue un buen día', 'Hoy fue un día pesado', 'Quiero platicarte algo'],
}
