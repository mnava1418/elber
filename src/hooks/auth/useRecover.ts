import { useState } from 'react'

const useRecover = (originalEmail: string) => {
    const [info, setInfo] = useState({email: originalEmail, result: '', error: ''})
    const [isProcessing, setIsProcessing] = useState(false)

    return {
        info, setInfo,
        isProcessing, setIsProcessing
    }
}

export default useRecover