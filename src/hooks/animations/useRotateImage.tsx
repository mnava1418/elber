import { useRef } from 'react';
import { Animated, Easing } from 'react-native';

const useSpinImage = () => {
    const spinImage = useRef(new Animated.Value(0)).current;

    const spinAnimation = Animated.loop(
        Animated.timing(spinImage, {
          toValue: 1,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

    return {spinImage, spinAnimation}
}

export default useSpinImage