import React from 'react'
import MainView from '../../../components/ui/MainView'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import NavBarBackBtn from '../../../components/navBar/NavBarBackBtn'
import { SettingsNavigationProps } from './SettingsNavigation'

const AccountScreen = () => {
    const navigation = useNavigation<NavigationProp<SettingsNavigationProps>>()
    const leftBtn = NavBarBackBtn(navigation)
    
    return (
        <MainView>
            <CustomNavBar leftBtn={leftBtn} title='Cuenta'/>
        </MainView>
    )
}

export default AccountScreen