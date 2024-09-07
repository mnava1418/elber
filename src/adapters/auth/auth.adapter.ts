import { FirebaseAuthTypes } from "@react-native-firebase/auth";

abstract class AuthAdapter {
    abstract signIn(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential>
}

export default AuthAdapter