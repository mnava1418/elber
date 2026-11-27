import type { Persistence, ReactNativeAsyncStorage } from '@firebase/auth'

// @firebase/auth's package.json lists its public "types" before the
// "react-native" condition, so TypeScript never sees the React Native build's
// extra export. Metro does load that build at runtime; this only declares it.
declare module '@firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence
}
