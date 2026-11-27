import type { LocationReply } from '../lib/socket'

/**
 * The device's location, for the backend's chat:location. Never rejects.
 * Until the app asks for the location permission (phase 8) it is unavailable,
 * and Elber asks the user for the place instead.
 */
export function currentLocation(): Promise<LocationReply> {
  return Promise.resolve({ error: 'UNAVAILABLE' })
}
