import AuthAdapter from "./auth.adapter";
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'

class FireBaseAuth implements AuthAdapter {
    async signIn(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password)
            return userCredential
        } catch (error) {
            throw new Error("Email y/o Password no válido");
        }
    }
}

export default FireBaseAuth