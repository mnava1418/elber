import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, ActivityIndicator } from 'react-native'
import { globalStyles, globalColors } from '../../../styles/mainStyles'
import CustomNavBar from '../../components/navBar/CustomNavBar'
import CustomButton from '../../components/ui/CustomButton'
import CustomText from '../../components/ui/CustomText'
import MainView from '../../components/ui/MainView'
import Subtitle from '../../components/ui/Subtitle'
import { useNavigation, NavigationProp, RouteProp, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StackNavigationProps } from '../../Elber'
import useRecover from '../../../hooks/auth/useRecover'
import { recoverPassword } from '../../../services/auth.service'
import NavBarBackBtn from '../../components/navBar/NavBarBackBtn'
import CustomAlert from '../../components/ui/CustomAlert'
import { AlertBtnProps } from '../../../interfaces/ui.interface'

const RecoverScreen = () => {
    const recoverProps = useRoute<RouteProp<StackNavigationProps, 'Recover'>>().params
    const {originalEmail} = recoverProps

    const {info, setInfo, isProcessing, setIsProcessing} = useRecover(originalEmail)
    const [alertText, setAlertText] = useState('')

    const alertBtns: AlertBtnProps[] = [
        {
            label: 'Ok',
            type: 'default',
            action: () => {
                setAlertText('')
            }
        }
    ]
    

    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const { top } = useSafeAreaInsets()
   
    const leftBtn = NavBarBackBtn(navigation)

    const handleSubmit = async() => {
        setAlertText('')
        setIsProcessing(true)
        
        try {
            await recoverPassword(info.email)
            setAlertText('Por favor, revisa tu bandeja de entrada para restablecer tu contraseña.')
        } catch (error) {            
            setAlertText((error as Error).message)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <MainView showBgImage >
            <CustomNavBar leftBtn={leftBtn} />
            <Subtitle style={{ marginTop: top + 56 }}>¿Olvidaste tu contraseña?</Subtitle>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={60}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                    <CustomText style={{marginTop: 10}}>Ingresa tu email y te enviaremos un enlace para que puedas restablecer tu contraseña.</CustomText>
                    <CustomText style={{ fontSize: 22, marginTop: 32 }}>Email</CustomText>
                    <TextInput
                        style={[globalStyles.input, { marginTop: 10 }]}
                        value={info.email}
                        onChangeText={(email) => {setInfo({...info, email})}}
                        keyboardType='email-address'
                        autoCapitalize='none'
                    />
                    {!isProcessing ? (
                        <View style={{ width: '100%' }}>
                            <CustomButton label='Recuperar' type='primary' style={{ marginTop: 56 }} onPress={handleSubmit} />                            
                        </View>
                    ) : (<ActivityIndicator size={'large'} color={globalColors.text} style={{marginTop: 56}} />)}
                </ScrollView>
            </KeyboardAvoidingView>
            <CustomAlert title='Recuperar Password' message={alertText} visible={alertText !== ''} alertBtns={alertBtns} />
        </MainView>
    )
}

export default RecoverScreen