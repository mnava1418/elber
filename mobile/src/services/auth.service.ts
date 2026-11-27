import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from '@firebase/auth'
import { apiPost } from '../lib/api'
import { auth } from '../lib/firebase'

// Copy of web/src/services/auth.service.ts.

export type { User }

export async function signIn(email: string, password: string): Promise<void> {
  if (!auth) throw new Error('Firebase no está configurado')
  await signInWithEmailAndPassword(auth, email, password)
}

export async function signOutUser(): Promise<void> {
  if (!auth) return
  await signOut(auth)
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

// The backend answers the same whether or not the email is registered,
// so success only means the request was accepted. The email's link opens
// the web, where the new password is set.
export async function requestPasswordReset(email: string): Promise<void> {
  await apiPost('/users/auth/password-reset', { email })
}
