import type { LocationReply } from '../lib/socket'

// The browser asks permission the first time; after that it remembers.
const OPTIONS: PositionOptions = { timeout: 10_000, maximumAge: 10 * 60_000 }

// ~1 km: enough for the weather, without sending the exact address.
const round = (n: number) => Math.round(n * 100) / 100

/** The device's location, for the backend's chat:location. Never rejects. */
export function currentLocation(): Promise<LocationReply> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve({ error: 'UNAVAILABLE' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: round(coords.latitude), lon: round(coords.longitude) }),
      (error) => resolve({ error: error.code === error.PERMISSION_DENIED ? 'DENIED' : 'UNAVAILABLE' }),
      OPTIONS,
    )
  })
}
