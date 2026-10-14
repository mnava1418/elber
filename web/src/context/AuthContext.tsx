import { createContext, useEffect, useState, type ReactNode } from 'react'
import {
  isAuthConfigured,
  subscribeToAuthChanges,
  type User,
} from '../services/auth.service'

type AuthContextValue = {
  user: User | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isAuthConfigured)

  useEffect(() => {
    if (!isAuthConfigured()) return
    return subscribeToAuthChanges((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
