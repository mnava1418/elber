import { useState } from 'react'

type SignInErrors = {
    email: string,
    password: string,
    default: string
}

const useSignIn = (currentEmail: string) => {
    const [email, setEmail] = useState(currentEmail)
    const [password, setPassword] = useState('')
    const[isProcessing, setIsProcessing] = useState(false)
    const[authError, setAuthError] = useState('')

    return {
        email, setEmail,
        password, setPassword,
        isProcessing, setIsProcessing,
        authError, setAuthError
    }
}

export default useSignIn