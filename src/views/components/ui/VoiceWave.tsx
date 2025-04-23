import React, { useContext, useEffect, useRef } from 'react'
import { GlobalContext } from '../../../store/GlobalState'
import { selectElberIsSpeaking } from '../../../store/selectors/elber.selector'
import Animated, {
    useSharedValue,    
    withTiming,    
    useAnimatedStyle,
    interpolateColor
} from 'react-native-reanimated'
import { View } from 'react-native'
import { globalColors, globalStyles } from '../../../styles/mainStyles'

const BAR_COUNT = 5
const MIN_SCALE = 0.3
const MAX_SCALE = 1.5

const VoiceWave = () => {
    const {state} = useContext(GlobalContext)
    const isSpeaking = selectElberIsSpeaking(state.elber)
    
    const bars = useRef(Array.from({ length: BAR_COUNT }, () => useSharedValue(1))).current
    const colorValue = useSharedValue(0)
    const intervals = useRef<Array<NodeJS.Timeout>>([])
  
    useEffect(() => {
        if (isSpeaking) {
          colorValue.value = withTiming(1, { duration: 200 })
    
          bars.forEach((bar, index) => {
            const animate = () => {
              const randomScale = MIN_SCALE + Math.random() * (MAX_SCALE - MIN_SCALE)
              const duration = 150 + Math.random() * 200
              bar.value = withTiming(randomScale, { duration })
            }
    
            animate()
    
            const interval = setInterval(() => {
              animate()
            }, 250 + index * 40)
    
            intervals.current[index] = interval
          })
        } else {
          colorValue.value = withTiming(0, { duration: 200 })
    
          intervals.current.forEach(clearInterval)
          intervals.current = []
    
          bars.forEach((bar) => {
            bar.value = withTiming(1, { duration: 200 })
          })
        }
      }, [isSpeaking])
  
    return (
      <View style={globalStyles.barContainer}>
        {bars.map((bar, index) => {
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scaleY: bar.value }],
            backgroundColor: interpolateColor(
                colorValue.value,
                [0, 1],
                [globalColors.primary, globalColors.text]
              ),
          }))
  
          return (
            <Animated.View
              key={index}
              style={[
                globalStyles.bar,
                animatedStyle,
                { marginHorizontal: 5 },
              ]}
            />
          )
        })}
      </View>
    )
}
  
export default VoiceWave