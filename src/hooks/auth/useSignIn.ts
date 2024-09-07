import { useState } from 'react'

const useSignIn = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const[emailError, setEmailError] = useState('')
    const[passwordError, setPasswordError] = useState('')
    const[signInError, setSignInError] = useState('')

    const[isProcessing, setIsProcessing] = useState(false)

    const clearErrors = () => {
        setEmailError('')
        setPasswordError('')
        setSignInError('')
    }

    return {
        email, setEmail, emailError, setEmailError,
        password, setPassword, passwordError, setPasswordError,
        signInError, setSignInError,
        isProcessing, setIsProcessing,
        clearErrors
    }
}

export default useSignIn