import React from 'react'
import { Text } from 'react-native'
import { globalStyles } from '../../../styles/mainStyles'
import { CustomTextProps } from '../../../interfaces/ui.interface'

const CustomText = ({style, children}: CustomTextProps) => {
    return (
        <Text style={[
            globalStyles.text,
            style,
        ]}>
            {children}
        </Text>
    )
}

export default CustomText