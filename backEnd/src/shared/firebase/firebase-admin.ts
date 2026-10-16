import admin from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import env from '../../config/env.js'

// Single Firebase Admin app for the whole backend. It lives in shared because
// more than one module will need it (e.g. verifying ID tokens on requests).
const firebaseApp = initializeApp({
    credential: admin.credential.cert(env.GOOGLE_APPLICATION_CREDENTIALS as string)    
})

export const firebaseAuth = getAuth(firebaseApp)
