import { useRef, useState } from 'react'

const useChatHistory = () => {
    const [isLoadingHistory, setIsLoadingHistory]= useState(true)
    const isLoadingMessages = useRef(false)

    return {
        isLoadingHistory, setIsLoadingHistory, 
        isLoadingMessages
    }
}

export default useChatHistory