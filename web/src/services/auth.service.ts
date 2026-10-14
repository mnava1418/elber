import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export type { User }

export function isAuthConfigured(): boolean {
  return Boolean(auth)
}

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
