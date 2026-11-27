// The app's configuration, read once at startup.
//
// Expo inlines EXPO_PUBLIC_* variables at build time, but only when they are
// written literally as process.env.EXPO_PUBLIC_X (no destructuring, no dynamic
// keys), so each one is listed by hand. They end up inside the app: never put
// secrets here.
const raw = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_CHAT_MOCK: process.env.EXPO_PUBLIC_CHAT_MOCK,
}

export interface Env {
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
  // Backend API including the version prefix, e.g. https://elber-api.namart.tech/api/v1.
  apiUrl: string
  // true = the chat answers with a canned demo, without the backend.
  chatMock: boolean
}

export type EnvResult = { ok: true; env: Env } | { ok: false; problems: string[] }

// Pure so it can be tested with any input.
export function parseEnv(values: Record<string, string | undefined>): EnvResult {
  const problems: string[] = []

  const required = (name: string): string => {
    const value = values[name]?.trim()
    if (!value) problems.push(`Falta ${name}`)
    return value ?? ''
  }

  const firebase = {
    apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: required('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: required('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: required('EXPO_PUBLIC_FIREBASE_APP_ID'),
  }

  const apiUrl = required('EXPO_PUBLIC_API_URL').replace(/\/+$/, '')
  if (apiUrl && !/^https?:\/\/[^/]+/.test(apiUrl)) {
    problems.push('EXPO_PUBLIC_API_URL debe ser una URL http(s), p. ej. https://elber-api.namart.tech/api/v1')
  }

  const mock = values.EXPO_PUBLIC_CHAT_MOCK?.trim() ?? 'false'
  if (mock !== 'true' && mock !== 'false') {
    problems.push('EXPO_PUBLIC_CHAT_MOCK debe ser true o false')
  }

  if (problems.length > 0) return { ok: false, problems }
  return { ok: true, env: { firebase, apiUrl, chatMock: mock === 'true' } }
}

// The root layout shows the problems instead of the app when this fails,
// so a bad .env is obvious on the device instead of a crash.
export const envResult = parseEnv(raw)
