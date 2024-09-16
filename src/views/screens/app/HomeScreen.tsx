import React from 'react'
import { View } from 'react-native'
import CustomButton from '../../components/ui/CustomButton'
import * as AuthServices from '../../../services/auth.service'

const HomeScreen = () => {
    return (
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center'}}>
            <CustomButton label='Sign Out' type='primary' onPress={() => {AuthServices.signOut()}}/>
        </View>
    )
}

export default HomeScreen