import React from 'react'
import { Text } from 'react-native'
import { CustomTextProps } from '../../../interfaces/ui.interface'
import { globalStyles } from '../../../styles/mainStyles'

const Subtitle = ({style, children}: CustomTextProps) => {
    return (
        <Text style={[
            globalStyles.text,
            globalStyles.subtitle,
            style,
        ]}>
            {children}
        </Text>
    )
}

export default Subtitle