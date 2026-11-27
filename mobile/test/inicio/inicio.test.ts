// The real modules read the env and start Firebase: none of that is under test.
jest.mock('../../src/lib/firebase', () => ({ auth: null }))
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn(), router: {} }))

import { conversationsQuery } from '../../src/chat/history'
import { ApiError, NetworkError } from '../../src/lib/api'
import { weekdayInitial, whenUpdated } from '../../src/inicio/format'
import { detail, headline } from '../../src/inicio/training-text'
import { diaryWeek, errorText, type TrainingCardData } from '../../src/inicio/useInicio'
import { MIN_RELOAD_GAP_MS, shouldReload } from '../../src/inicio/useReloadOnReturn'
import { addDays, localToday } from '../../src/training/dates'

describe('dates', () => {
  it('adds days across months and years in UTC', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('reads today from the local clock', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('whenUpdated', () => {
  const now = new Date(2026, 10, 27, 18, 0)

  it('says today with the time, then yesterday, then the weekday', () => {
    expect(whenUpdated(new Date(2026, 10, 27, 9, 40).toISOString(), now)).toMatch(/^Hoy, 9:40/)
    expect(whenUpdated(new Date(2026, 10, 26, 22, 0).toISOString(), now)).toBe('Ayer')
    expect(whenUpdated(new Date(2026, 10, 23, 12, 0).toISOString(), now)).toBe('Lunes')
  })

  it('falls back to the day and month after a week', () => {
    expect(whenUpdated(new Date(2026, 10, 12, 12, 0).toISOString(), now)).toBe('12 nov')
  })
})

describe('weekdayInitial', () => {
  it('reads the day in UTC', () => {
    expect(weekdayInitial('2026-11-23')).toBe('L')
    expect(weekdayInitial('2026-11-26')).toBe('J')
  })
})

describe('diaryWeek', () => {
  it('builds the last 7 days ending today, oldest first', () => {
    const data = diaryWeek('2026-11-27', ['2026-11-27', '2026-11-25', '2026-11-10'])
    expect(data.talkedToday).toBe(true)
    expect(data.week.map((d) => d.date)).toEqual([
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
    ])
    expect(data.week.filter((d) => d.talked).map((d) => d.date)).toEqual(['2026-11-25', '2026-11-27'])
  })

  it('says we did not talk today', () => {
    expect(diaryWeek('2026-11-27', []).talkedToday).toBe(false)
  })
})

describe('errorText', () => {
  it('tells a lost connection and the rate limit apart', () => {
    // Android's fetch rejects with a plain Error, iOS's with a TypeError: both arrive as NetworkError.
    expect(errorText(new NetworkError(new Error('fetch failed: java.net.ConnectException')))).toBe('No pudimos conectar con Elber.')
    expect(errorText(new NetworkError(new TypeError('Network request failed')))).toBe('No pudimos conectar con Elber.')
    expect(errorText(new ApiError(429, 'TOO_MANY_REQUESTS', ''))).toMatch(/Demasiadas peticiones/)
  })

  it('has a generic message for the rest', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    expect(errorText(new ApiError(500, 'INTERNAL_ERROR', ''))).toBe('No pudimos cargar esto.')
    warn.mockRestore()
  })
})

describe('training card texts', () => {
  const base: TrainingCardData = {
    planName: null,
    nextRoutine: null,
    trainedToday: null,
    streakWeeks: 0,
    thisWeek: { done: 0, target: 0 },
  }

  it('without a plan', () => {
    expect(headline(base)).toBe('Sin plan activo')
    expect(detail(base)).toMatch(/Pídele a Elber/)
  })

  it('with a routine to do today', () => {
    const data = { ...base, planName: 'Fuerza', nextRoutine: 'Pierna' }
    expect(headline(data)).toBe('Hoy toca: Pierna')
    expect(detail(data)).toBe('De tu plan Fuerza.')
  })

  it('after training today', () => {
    const data = { ...base, planName: 'Fuerza', trainedToday: { routineName: 'Pierna' } }
    expect(headline(data)).toBe('Hoy ya entrenaste')
    expect(detail(data)).toBe('Pierna. ¡Bien hecho!')
  })
})

describe('reloading', () => {
  it('waits the minimum gap between loads', () => {
    expect(shouldReload(0, MIN_RELOAD_GAP_MS - 1)).toBe(false)
    expect(shouldReload(0, MIN_RELOAD_GAP_MS)).toBe(true)
  })
})

describe('conversationsQuery', () => {
  it('builds the query by hand', () => {
    expect(conversationsQuery()).toBe('')
    expect(conversationsQuery(undefined, 3)).toBe('?limit=3')
    expect(conversationsQuery('a/b', 7)).toBe('?cursor=a%2Fb&limit=7')
  })
})
