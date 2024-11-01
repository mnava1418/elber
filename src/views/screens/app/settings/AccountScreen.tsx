import React, { useContext, useState } from 'react'
import MainView from '../../../components/ui/MainView'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import NavBarBackBtn from '../../../components/navBar/NavBarBackBtn'
import { SettingsNavigationProps } from './SettingsNavigation'
import { ScrollView, View } from 'react-native'
import { globalColors } from '../../../../styles/mainStyles'
import CustomAlert from '../../../components/ui/CustomAlert'
import CustomButton from '../../../components/ui/CustomButton'
import CustomText from '../../../components/ui/CustomText'
import Subtitle from '../../../components/ui/Subtitle'
import Title from '../../../components/ui/Title'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlobalContext } from '../../../../store/GlobalState'
import { selectAuthenticatedUser } from '../../../../store/selectors/auth.selector'
import { recoverPassword, signOut } from '../../../../services/auth.service'
import { AlertBtnProps } from '../../../../interfaces/ui.interface'
import { ActivityIndicator } from 'react-native'

const AccountScreen = () => {
    const navigation = useNavigation<NavigationProp<SettingsNavigationProps>>()
    const leftBtn = NavBarBackBtn(navigation)

    const {top} = useSafeAreaInsets()
    const {state} = useContext(GlobalContext)
    const user = selectAuthenticatedUser(state.auth)

    const [isProcessing, setIsProcessing] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const alertBtns: AlertBtnProps[] = [{
        label: 'Ok',
        type: 'default',
        action: () => {
            setModalVisible(false)
            signOut()
        }
    }]

    const handleResetPassword = async() => {
        try {
            setIsProcessing(true)
            await recoverPassword(user.email)
            setModalVisible(true)
        } catch (error) {
            setModalVisible(false)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <MainView>
            <CustomNavBar leftBtn={leftBtn} title='Perfil'/>
            <ScrollView style={{marginTop: top + 72}}>
                <View style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: 16}}>
                    <View style={{height: 80, width: 80, backgroundColor: globalColors.primary, borderRadius: 50, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                        <Title>{user.email.charAt(0).toUpperCase()}</Title>
                    </View>
                    <View style={{marginTop: 16, flexDirection: 'column', alignItems: 'center'}}>
                        <Subtitle style={{marginBottom: 8}}>{`Hola, ${user.name}`}</Subtitle>
                        <CustomText>{user.email}</CustomText>
                    </View>
                </View>
                {!isProcessing ? 
                    (<CustomButton style={{marginVertical: 24}} label='Cambiar Password' type='primary' onPress={handleResetPassword}/>) 
                    : 
                    (<ActivityIndicator size={'large'} color={globalColors.text} style={{marginTop: 56}} />)
                }
            </ScrollView>
            <CustomAlert 
                title='Cambiar Password' 
                message='Te hemos enviado un correo para que puedas cambiar tu password. Tu sesión va a finalizar.' 
                alertBtns={alertBtns} 
                visible={modalVisible} 
            />
        </MainView>
    )
}

export default AccountScreen