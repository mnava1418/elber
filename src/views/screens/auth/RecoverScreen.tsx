import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, ActivityIndicator } from 'react-native'
import { globalStyles, globalColors } from '../../../styles/mainStyles'
import CustomNavBar from '../../components/navBar/CustomNavBar'
import CustomButton from '../../components/ui/CustomButton'
import CustomText from '../../components/ui/CustomText'
import MainView from '../../components/ui/MainView'
import Subtitle from '../../components/ui/Subtitle'
import { useNavigation, NavigationProp, RouteProp, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomNavBtnProps } from '../../../interfaces/ui.interface'
import { StackNavigationProps } from '../../Elber'
import useRecover from '../../../hooks/auth/useRecover'
import { recoverPassword } from '../../../services/auth.service'
import { fbAuthFetcher } from '../../../adapters/auth/fbFecther.adapter'


const RecoverScreen = () => {
    const recoverProps = useRoute<RouteProp<StackNavigationProps, 'Recover'>>().params
    const {originalEmail} = recoverProps

    const {info, setInfo, isProcessing, setIsProcessing} = useRecover(originalEmail)
    

    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const { top } = useSafeAreaInsets()
   
    const leftBtn: CustomNavBtnProps = {
        icon: 'chevron-back-outline',
        onPress: () => { navigation.goBack() }
    }

    const handleSubmit = async() => {
        setInfo({...info, error: '', result: ''})
        setIsProcessing(true)
        
        try {
            await recoverPassword(fbAuthFetcher, info.email)
            setInfo((prev) => ({...prev, result: 'Por favor, revisa tu bandeja de entrada para restablecer tu contraseña.'}))
        } catch (error) {
            setInfo((prev) => ({...prev, error: (error as Error).message}))
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <MainView>
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
                    {info.error && info.error.trim() !== '' ? <CustomText style={{ color: '#FF4C4C', marginTop: 8 }}>{info.error}</CustomText> : <></>}
                    {!isProcessing ? (
                        <View style={{ width: '100%' }}>
                            <CustomButton label='Recuperar' type='primary' style={{ marginTop: 56 }} onPress={handleSubmit} />
                            {info.result && info.result.trim() !== '' ? <CustomText style={{ color: globalColors.text, marginTop: 16 }}>{info.result}</CustomText> : <></>}
                        </View>
                    ) : (<ActivityIndicator size={'large'} color={globalColors.text} style={{marginTop: 56}} />)}
                </ScrollView>
            </KeyboardAvoidingView>
        </MainView>
    )
}

export default RecoverScreen