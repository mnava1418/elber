// The real modules read the env and start Firebase: only ApiError matters here.
jest.mock('../../src/lib/firebase', () => ({ auth: null }))

import { ApiError, NetworkError } from '../../src/lib/api'
import { EMAIL_RE, passwordResetErrorMessage, signInErrorMessage } from '../../src/services/auth-errors'

describe('signInErrorMessage', () => {
  it('tells a lost connection apart from wrong credentials', () => {
    expect(signInErrorMessage({ code: 'auth/network-request-failed' })).toMatch(/conexión/)
    expect(signInErrorMessage({ code: 'auth/too-many-requests' })).toMatch(/demasiados intentos/)
  })

  it('says the credentials are wrong for anything else', () => {
    expect(signInErrorMessage({ code: 'auth/invalid-credential' })).toBe('Correo y/o contraseña incorrectos.')
    expect(signInErrorMessage(new Error('boom'))).toBe('Correo y/o contraseña incorrectos.')
    expect(signInErrorMessage(null)).toBe('Correo y/o contraseña incorrectos.')
  })
})

describe('passwordResetErrorMessage', () => {
  it('maps the backend answers like the web', () => {
    expect(passwordResetErrorMessage(new ApiError(429, 'RATE_LIMITED', ''))).toMatch(/demasiados intentos/)
    expect(passwordResetErrorMessage(new ApiError(400, 'INVALID_EMAIL', ''))).toMatch(/correo válido/)
    expect(passwordResetErrorMessage(new NetworkError(new Error('fetch failed')))).toMatch(/conexión/)
  })
})

describe('EMAIL_RE', () => {
  it('accepts emails and rejects the rest', () => {
    expect(EMAIL_RE.test('tu@correo.com')).toBe(true)
    expect(EMAIL_RE.test('tu@correo')).toBe(false)
    expect(EMAIL_RE.test('tu correo@x.com')).toBe(false)
  })
})

