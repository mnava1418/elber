jest.mock('../../src/config/env', () => ({ envResult: { ok: true, env: { apiUrl: 'http://api.test/api/v1' } } }))
jest.mock('../../src/lib/firebase', () => ({ auth: null }))

import { ApiError, apiPost, NetworkError } from '../../src/lib/api'

describe('the API client', () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  it('turns any fetch failure into a NetworkError', async () => {
    // What Android's fetch rejects with when nothing answers.
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('fetch failed: java.net.ConnectException'))
    await expect(apiPost('/x', {})).rejects.toBeInstanceOf(NetworkError)
  })

  it('lets an abort through as it is', async () => {
    const abort = Object.assign(new Error('Aborted'), { name: 'AbortError' })
    globalThis.fetch = jest.fn().mockRejectedValue(abort)
    await expect(apiPost('/x', {})).rejects.toBe(abort)
  })

  it('turns an error answer into an ApiError with its code', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: () => Promise.resolve({ error: { code: 'TOO_MANY_REQUESTS', message: 'Espera' } }),
    })
    const error = await apiPost('/x', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 429, code: 'TOO_MANY_REQUESTS' })
  })
})
