import React from 'react'
import MainView from '../../components/ui/MainView'
import CustomButton from '../../components/ui/CustomButton'
import { signOut } from '../../../services/auth.service'

const SettingsScreen = () => {
    return (
        <MainView style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <CustomButton label='Sign Out' type='primary' onPress={() => {signOut()}}/>
        </MainView>
    )
}

export default SettingsScreen