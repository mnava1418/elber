import { useRef, useState } from 'react'

const useElber = () => {
    const [prompt, setPrompt] = useState('')
    const [alertVisible, setAlertVisible] = useState(false)
    const silenceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isListening = useRef(false)
    const promptRef = useRef('')
    
    return {
        silenceTimeout, isListening, promptRef,
        prompt, setPrompt,
        alertVisible, setAlertVisible
    }
}

export default useElber