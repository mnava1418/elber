import { useState } from "react"

const useAnimations = () => {
    
    //START: Animate text
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
    //END: Animate text

    return {
        animatedText, animateText
    }
}

export default useAnimations