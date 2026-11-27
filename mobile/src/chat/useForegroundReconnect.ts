import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import type { ConnectionState } from './types'

// Only these get better by reconnecting (see useChat's onClose).
export const shouldReconnectOnReturn = (connection: ConnectionState) => connection === 'reconnecting'

/**
 * A phone suspends the app in the background and its socket dies with it.
 * useChat then waits its backoff (up to 30 s) before trying again, which is
 * long for someone who just came back: reconnect as soon as the app returns.
 * A short trip away may keep the socket alive, and then nothing changes.
 */
export function useForegroundReconnect(connection: ConnectionState, reconnectNow: () => void) {
  // The latest values, without re-subscribing on every change.
  const latest = useRef({ connection, reconnectNow })
  useEffect(() => {
    latest.current = { connection, reconnectNow }
  })

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && shouldReconnectOnReturn(latest.current.connection)) latest.current.reconnectNow()
    })
    return () => subscription.remove()
  }, [])
}
