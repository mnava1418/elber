import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'

// The API allows 300 requests per 15 minutes per IP, and Inicio costs four:
// coming back sooner than this keeps what's on screen.
export const MIN_RELOAD_GAP_MS = 30_000

// Whether enough time passed since the last load to load again.
export const shouldReload = (lastLoad: number, now: number) => now - lastLoad >= MIN_RELOAD_GAP_MS

// Calls `reload` when the user comes back to the screen: from another screen
// of the app (the stack keeps this one alive) or from another app.
export function useReloadOnReturn(reload: () => void) {
  const lastLoad = useRef(0)
  const firstFocus = useRef(true)

  // The first load is the screen's own, when it mounts.
  useEffect(() => {
    lastLoad.current = Date.now()
  }, [])

  const maybeReload = useCallback(() => {
    const now = Date.now()
    if (!shouldReload(lastLoad.current, now)) return
    lastLoad.current = now
    reload()
  }, [reload])

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false
        return
      }
      maybeReload()
    }, [maybeReload]),
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') maybeReload()
    })
    return () => subscription.remove()
  }, [maybeReload])

  // Pull to refresh counts as a load too.
  return useCallback(() => {
    lastLoad.current = Date.now()
  }, [])
}
