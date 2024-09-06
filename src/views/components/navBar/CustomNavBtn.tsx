import React from 'react'
import { Pressable } from 'react-native'
import AppIcon from '../ui/AppIcon'
import { CustomNavBtnProps } from '../../../interfaces/ui.interface'

const CustomNavBtn = ({icon = '', onPress = () => {}, style}: CustomNavBtnProps) => {
    return (
        <Pressable
            style={({pressed}) => ([
                style,
                {opacity: pressed ? 0.8 : 1.0}
                ]
            )}
            onPress={onPress}
        >
            <AppIcon name={icon} />
        </Pressable>
    )
}

export default CustomNavBtn