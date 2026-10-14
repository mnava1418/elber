class AuthService {
    constructor() {}

    resetPassword = async (email: string) => {
        console.log('Vamos a cambiar el password... ', email)
    }
}

export default AuthService
