jest.mock('../../src/lib/firebase', () => ({ auth: null }))

import { composerHint } from '../../src/chat/composer-hint'
import { toTurns } from '../../src/chat/history'
import { hostOf, toolDetail, toolKind } from '../../src/chat/tools'
import { shouldReconnectOnReturn } from '../../src/chat/useForegroundReconnect'

describe('hostOf', () => {
  it('reads the host of a URL without www', () => {
    expect(hostOf('https://www.Ejemplo.com/a?b=1')).toBe('ejemplo.com')
    expect(hostOf('http://user@api.test:3000/x')).toBe('api.test')
  })

  it('is null for something that is not a URL', () => {
    expect(hostOf('clima en CDMX')).toBeNull()
  })
})

describe('tools', () => {
  it('maps the backend names, with web search as the fallback', () => {
    expect(toolKind('get_weather')).toBe('weather')
    expect(toolKind('get_active_plan')).toBe('get_plans')
    expect(toolKind('something_new')).toBe('search')
  })

  it('shows the domain for pages and the user for a weather without place', () => {
    expect(toolDetail('read', 'https://www.ejemplo.com/a')).toBe('ejemplo.com')
    expect(toolDetail('read', 'no es url')).toBe('no es url')
    expect(toolDetail('weather')).toBe('tu ubicación')
  })
})

describe('toTurns', () => {
  it('links each answer to the question before it', () => {
    const turns = toTurns([
      { id: 'u1', createdAt: '', role: 'user', text: 'hola' },
      {
        id: 'e1',
        createdAt: '',
        role: 'elber',
        text: 'Hola',
        status: 'done',
        sources: [],
        tools: [{ name: 'WebSearch', detail: 'clima' }],
        widgets: [],
      },
    ])
    expect(turns[1]).toMatchObject({ role: 'elber', replyTo: 'u1', steps: [{ id: 'e1-0', kind: 'search', detail: 'clima', status: 'done' }] })
  })
})

describe('composerHint', () => {
  it('explains why it cannot send', () => {
    expect(composerHint('connecting', false)).toBe('Conectando con Elber…')
    expect(composerHint('reconnecting', false)).toMatch(/Sin conexión/)
    expect(composerHint('open', true)).toMatch(/4,000|4 000|4000/)
    expect(composerHint('open', false)).toBeNull()
  })
})

describe('shouldReconnectOnReturn', () => {
  it('only while waiting to reconnect', () => {
    expect(shouldReconnectOnReturn('reconnecting')).toBe(true)
    expect(shouldReconnectOnReturn('open')).toBe(false)
    expect(shouldReconnectOnReturn('rejected')).toBe(false)
  })
})
