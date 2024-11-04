import { useState } from "react";

const useChat = () => {

    const [message, setMessage] = useState('')
    const [btnType, setBtnType] = useState<'primary' | 'outline'>('outline')
    const [inputState, setInputState] = useState({
        keyboardOffset: 0,
        height: 40,
    })

    return {
        inputState, setInputState,
        message, setMessage,
        btnType, setBtnType
    }
}

export default useChat