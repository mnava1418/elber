import { FirebaseAuthTypes } from "@react-native-firebase/auth";

abstract class AuthAdapter {
    abstract signIn(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential>
    abstract signOut(): Promise<void>
    abstract resetPassword(email: string): Promise<void>
}

export default AuthAdapter