import CustomError from "../../models/CustomError";
import AuthAdapter from "./auth.adapter";
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'

class FireBaseAuth implements AuthAdapter {
    async signIn(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password)
            return userCredential
        } catch (error) {
            throw new CustomError('Email y/o Password no válido.');
        }
    }

    async signOut(): Promise<void> {
        try {
            await auth().signOut()
        } catch (error) {
            throw new Error('Unable to sign out.');
        }
    }
}

export default FireBaseAuth