import { parseEnv } from '../../src/config/env'

const valid = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'key',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'elber.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'elber',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'elber.appspot.com',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123',
  EXPO_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
  EXPO_PUBLIC_API_URL: 'https://elber-api.namart.tech/api/v1/',
  EXPO_PUBLIC_CHAT_MOCK: 'false',
}

describe('parseEnv', () => {
  it('accepts a complete configuration and trims the API trailing slash', () => {
    const result = parseEnv(valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.env.apiUrl).toBe('https://elber-api.namart.tech/api/v1')
    expect(result.env.chatMock).toBe(false)
    expect(result.env.firebase.projectId).toBe('elber')
  })

  it('lists every missing variable', () => {
    const result = parseEnv({ ...valid, EXPO_PUBLIC_FIREBASE_API_KEY: '', EXPO_PUBLIC_API_URL: undefined })
    expect(result).toEqual({
      ok: false,
      problems: ['Falta EXPO_PUBLIC_FIREBASE_API_KEY', 'Falta EXPO_PUBLIC_API_URL'],
    })
  })

  it('rejects an API URL that is not http(s)', () => {
    const result = parseEnv({ ...valid, EXPO_PUBLIC_API_URL: 'elber-api.namart.tech' })
    expect(result.ok).toBe(false)
  })

  it('defaults the mock to false and rejects anything but true/false', () => {
    const withoutMock = parseEnv({ ...valid, EXPO_PUBLIC_CHAT_MOCK: undefined })
    expect(withoutMock.ok && withoutMock.env.chatMock).toBe(false)
    expect(parseEnv({ ...valid, EXPO_PUBLIC_CHAT_MOCK: 'yes' }).ok).toBe(false)
  })
})
