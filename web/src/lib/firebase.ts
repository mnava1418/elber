import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export let app: FirebaseApp | null = null
export let auth: Auth | null = null

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
} else if (import.meta.env.DEV) {
  console.warn(
    'Firebase no está configurado: agrega las variables VITE_FIREBASE_* en web/.env.local (ver .env.example) para habilitar el login.',
  )
}
