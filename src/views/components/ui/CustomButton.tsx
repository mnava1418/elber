import React from 'react'
import { Pressable, Text } from 'react-native'
import { CustomButtonProps } from '../../../interfaces/ui.interface'
import { globalStyles } from '../../../styles/mainStyles'


const CustomButton = ({label, type, style}: CustomButtonProps) => {
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
        >
            <Text style={globalStyles.btnText}>
                {label}
            </Text>
        </Pressable>
    )
}

export default CustomButton