import { useState } from "react"

const useSignUp = () => {
    const [email, setEmail] = useState('')
    const [result, setResult] = useState('')
    const [alertError, setAlertError] = useState('')
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [passwords, setPasswords] = useState({newPwd: '', confirmPwd: ''})

    const resetState = () => {
        setResult('')
        setAlertError('')
    }

    return {
        email, setEmail,
        result, setResult,
        code, setCode,
        name, setName,
        passwords, setPasswords,
        alertError, setAlertError, resetState
    }
}

export default useSignUp