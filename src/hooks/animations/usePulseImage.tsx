import { useRef } from 'react'
import { Animated } from 'react-native';

const usePulseImage = (duration: number, toValue: number) => {
    const scaleImage = useRef(new Animated.Value(1)).current;

    const pulseImage = Animated.loop(
        Animated.sequence([
            Animated.timing(scaleImage, {
                toValue: toValue, 
                duration: duration,
                useNativeDriver: true,
            }),
            Animated.timing(scaleImage, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
            }),
        ])
    );

    return { scaleImage, pulseImage}
}

export default usePulseImage