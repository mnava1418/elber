import { useState } from "react";
import { selectElberIsProcessing } from "../../store/selectors/elber.selector";
import { ElberState } from "../../store/reducers/elber.reducer";

const useChat = (state: ElberState) => {    
    const isElberProcessing = selectElberIsProcessing(state)
    const [message, setMessage] = useState('')
    const [btnType, setBtnType] = useState<'primary' | 'outline'>('outline')
    const [inputState, setInputState] = useState({
        keyboardOffset: 0,
        height: 40,
    })

    return {
        isElberProcessing,
        inputState, setInputState,
        message, setMessage,
        btnType, setBtnType,        
    }
}

export default useChat