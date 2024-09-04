import { useState } from "react"

const useAnimateText = () => {
    const [animatedText, setAnimatedText] = useState('')

    const animateText = (text: string, speed = 100) => {
        setAnimatedText('')

        let index = 0
        const interval = setInterval(() => {
            setAnimatedText((prev) => prev + text[index] )
            index ++

            if(index >= text.length) {
                clearInterval(interval)
            }
        }, speed)
    }
    
    return {
        animatedText, animateText
    }
}

export default useAnimateText