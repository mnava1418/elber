import { useState } from "react"

const useSignUp = () => {
    const [email, setEmail] = useState('')
    const [result, setResult] = useState('')
    const [errors, setErrors] = useState({email: '', default: ''})

    const resetState = () => {
        setResult('')
        setErrors({email: '', default: ''})
    }

    return {
        email, setEmail,
        result, setResult,
        errors, setErrors, resetState
    }
}

export default useSignUp