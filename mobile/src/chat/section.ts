import { envResult } from '../config/env'
import { mockTransport, socketIoTransport, type Transport } from './transport'

// A section of the app with its own chat: its own agent and conversations in
// the backend (its namespace and API path), and its own screen here. Copy of
// web/src/chat/section.ts: change both together.
export interface ChatSection {
  // Route of its screen, e.g. /chat/<id>.
  path: '/chat' | '/diario'
  // Backend API path of its history, e.g. /chat/conversations.
  api: string
  // One conversation per day (the diary): the screen opens today's and there
  // is no "new conversation".
  daily: boolean
  // Stable for the screen (useChat needs it so).
  transport: Transport
  greeting: string
  intro: string
  suggestions: string[]
}

// EXPO_PUBLIC_CHAT_MOCK=true answers with a canned demo: handy to work on the
// UI without the backend (and without spending API credits).
const transportFor = (namespace: string) => (envResult.ok && envResult.env.chatMock ? mockTransport : socketIoTransport(namespace))

export const CHAT: ChatSection = {
  path: '/chat',
  api: '/chat',
  daily: false,
  transport: transportFor('/chat'),
  greeting: '¿En qué te ayudo hoy?',
  intro: 'Pregúntame lo que quieras. Puedo buscar en la web, leer páginas y ayudarte a organizar tu día.',
  suggestions: ['Dame el clima actual en Nueva York', '¿Que pendientes tengo?', '¿Cuando juega el Real Madrid?'],
}

export const DIARY: ChatSection = {
  path: '/diario',
  api: '/diary',
  daily: true,
  transport: transportFor('/diary'),
  greeting: '¿Cómo te fue hoy?',
  intro: 'Platícame de tu día. Cuando terminemos, te propongo un resumen para tu diario.',
  suggestions: ['Hoy fue un buen día', 'Hoy fue un día pesado', 'Quiero platicarte algo'],
}
