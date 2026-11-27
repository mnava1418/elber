import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { subscribeToAuthChanges, type User } from '../services/auth.service'

type AuthContextValue = {
  user: User | null
  // True until Firebase has read the saved session from AsyncStorage.
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(
    () =>
      subscribeToAuthChanges((nextUser) => {
        setUser(nextUser)
        setLoading(false)
      }),
    [],
  )

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
