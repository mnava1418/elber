import React from 'react'
import CustomButton from '../../components/ui/CustomButton'
import * as AuthServices from '../../../services/auth.service'
import MainView from '../../components/ui/MainView'

const HomeScreen = () => {
    return (
        <MainView style={{justifyContent: 'center', alignItems: 'center'}}>
            <CustomButton label='Sign Out' type='primary' onPress={() => {AuthServices.signOut()}}/>
        </MainView>
    )
}

export default HomeScreen