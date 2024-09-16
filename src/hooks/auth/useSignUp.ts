import { useState } from "react"

const useSignUp = () => {
    const [email, setEmail] = useState('')
    const [result, setResult] = useState('')
    const [errors, setErrors] = useState({email: '', password: '', name: '', default: ''})
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [passwords, setPasswords] = useState({newPwd: '', confirmPwd: ''})

    const resetState = () => {
        setResult('')
        setErrors({email: '', password: '', name: '', default: ''})
    }

    return {
        email, setEmail,
        result, setResult,
        code, setCode,
        name, setName,
        passwords, setPasswords,
        errors, setErrors, resetState
    }
}

export default useSignUp