import React from 'react'
import { Pressable, Text } from 'react-native'
import { CustomButtonProps } from '../../../interfaces/ui.interface'
import { globalColors, globalStyles } from '../../../styles/mainStyles'


const CustomButton = ({label, type, style, onPress}: CustomButtonProps) => {
    let btnStyles: Array<any> = [globalStyles.btn]

    switch (type) {
        case 'primary':
            btnStyles = [...btnStyles, globalStyles.btnPrimary]
            break;
        default:
            break;
    }

    return (
        <Pressable 
            style={({pressed}) => ([
                ...btnStyles,
                style,
                {
                    opacity: pressed ? 0.8 : 1.0
                }
            ])}
            onPress={onPress}
        >
            <Text style={[globalStyles.btnText, {color: type === 'danger' ? globalColors.alert : globalColors.text}]}>
                {label}
            </Text>
        </Pressable>
    )
}

export default CustomButton