import { useRoute, RouteProp } from '@react-navigation/native'
import React from 'react'
import { Text, View } from 'react-native'
import { StackNavigationProps } from '../../../Elber'
import { globalColors } from '../../../../styles/mainStyles'

const SignUpScreen = () => {
    const {code} = useRoute<RouteProp<StackNavigationProps, 'SignUp'>>().params
    
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{color: globalColors.text}}>{code}</Text>
        </View>
    )
}

export default SignUpScreen