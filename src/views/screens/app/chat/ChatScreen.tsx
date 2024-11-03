import React from 'react'
import MainView from '../../../components/ui/MainView'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { MainScreenTapProps } from '../MainScreen'
import { CustomNavBtnProps } from '../../../../interfaces/ui.interface'

const ChatScreen = () => {
    const navigation = useNavigation<NavigationProp<MainScreenTapProps>>()
    
    const backBtn: CustomNavBtnProps = {
        icon: 'chevron-back-outline',
        onPress: () => { navigation.navigate('Home')}
    }

    return (
        <MainView>
            <CustomNavBar leftBtn={backBtn} title='Chat'/>            
        </MainView>
    )
}

export default ChatScreen