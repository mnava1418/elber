import React from 'react'
import { View } from 'react-native'
import CustomButton from '../../components/ui/CustomButton'
import { fbAuthFetcher } from '../../../adapters/auth/fbFecther.adapter'
import * as AuthServices from '../../../services/auth.service'

const HomeScreen = () => {
    return (
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center'}}>
            <CustomButton label='Sign Out' type='primary' onPress={() => {AuthServices.signOut(fbAuthFetcher)}}/>
        </View>
    )
}

export default HomeScreen