import { useNavigation, NavigationProp } from '@react-navigation/native'
import React from 'react'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import NavBarBackBtn from '../../../components/navBar/NavBarBackBtn'
import MainView from '../../../components/ui/MainView'
import { SettingsNavigationProps } from './SettingsNavigation'

const PrivacyScreen = () => {
    const navigation = useNavigation<NavigationProp<SettingsNavigationProps>>()
    const leftBtn = NavBarBackBtn(navigation)
    
    return (
        <MainView>
            <CustomNavBar leftBtn={leftBtn} title='Privacidad'/>
        </MainView>
    )
}

export default PrivacyScreen