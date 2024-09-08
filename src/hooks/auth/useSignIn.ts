import { useState } from 'react'

type SignInErrors = {
    email: string,
    password: string,
    default: string
}

const useSignIn = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const[isProcessing, setIsProcessing] = useState(false)
    const[authErrors, setAuthErrors] = useState<SignInErrors>({default: '', email: '', password: ''})

    return {
        email, setEmail,
        password, setPassword,
        isProcessing, setIsProcessing,
        authErrors, setAuthErrors
    }
}

export default useSignIn