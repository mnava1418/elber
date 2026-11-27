import AsyncStorage from '@react-native-async-storage/async-storage'
import { initializeApp } from 'firebase/app'
// From @firebase/auth, not firebase/auth: only its react-native build (which
// Metro and TypeScript pick through the "react-native" export condition) has
// getReactNativePersistence. firebase/auth re-exports this same package.
import { getReactNativePersistence, initializeAuth, type Auth } from '@firebase/auth'
import { envResult } from '../config/env'

// Same Firebase web app as the web (web/src/lib/firebase.ts). On a phone the
// session is kept in AsyncStorage, so it survives closing the app.
// Null when the configuration is invalid: the root layout shows ConfigError then.
export const auth: Auth | null = envResult.ok
  ? initializeAuth(initializeApp(envResult.env.firebase), {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : null
