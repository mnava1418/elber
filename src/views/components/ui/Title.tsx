import React from 'react'
import { Text } from 'react-native'
import { CustomTextProps } from '../../../interfaces/ui.interface'
import { globalStyles } from '../../../styles/mainStyles'

const Title = ({style, children}: CustomTextProps) => {
    return (
        <Text style={[
            globalStyles.text,
            globalStyles.title,
            style,
        ]}>
            {children}
        </Text>
    )
}

export default Title