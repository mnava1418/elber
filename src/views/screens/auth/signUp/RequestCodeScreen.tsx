import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, ActivityIndicator } from 'react-native'
import { globalStyles, globalColors } from '../../../../styles/mainStyles'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import CustomButton from '../../../components/ui/CustomButton'
import CustomText from '../../../components/ui/CustomText'
import MainView from '../../../components/ui/MainView'
import Subtitle from '../../../components/ui/Subtitle'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StackNavigationProps } from '../../../Elber'
import useSignUp from '../../../../hooks/auth/useSignUp'
import { requestCode } from '../../../../services/auth.service'
import CustomError from '../../../../models/CustomError'
import NavBarBackBtn from '../../../components/navBar/NavBarBackBtn'

const RequestCodeScreen = () => {
    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const { top } = useSafeAreaInsets()
    const [isProcessing, setIsProcessing] = useState(false)

    const {
        email, setEmail,
        result, setResult,
        errors, setErrors,
        resetState
    } = useSignUp()
    
    const leftBtn = NavBarBackBtn(navigation)

    const handleRequest = async() => {
        setIsProcessing(true)
        resetState()

        try {
            const response = await requestCode(email)
            setResult(response)
        } catch (error) {
            if (error instanceof CustomError) {
                setErrors((prevErrors) => ({...prevErrors, [error.type]: error.message}))
            } else {
                setErrors((prevErrors) => ({...prevErrors, default: 'Error inesperado. Intenta nuevamente.'}))
            }
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <MainView showBgImage >
            <CustomNavBar leftBtn={leftBtn} />
            <Subtitle style={{ marginTop: top + 56 }}>Hola, ¡empecemos tu registro!</Subtitle>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={60}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                    <CustomText style={{marginTop: 20}}><CustomText style={{fontWeight: '700'}}>Paso 1:</CustomText> Solicita tu código de registro. Tras aprobar tu solicitud, te enviaremos un código para quue puedas continuar.</CustomText>
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Email</CustomText>
                    <TextInput
                        style={[globalStyles.input, { marginTop: 10 }]}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                    />
                    {errors.email && errors.email.trim() !== '' ? <CustomText style={{ color: globalColors.alert, marginTop: 8 }}>{errors.email}</CustomText> : <></>}
                    {!isProcessing ? (
                        <View style={{ width: '100%' }}>
                            <CustomButton label='Solicitar código' type='primary' style={{ marginTop: 56 }} onPress={handleRequest} />
                            <View style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
                                {errors.default && errors.default.trim() !== '' ? <CustomText style={{ color: globalColors.alert, marginTop: 8 }}>{errors.default}</CustomText> : <></>}
                                {result.trim() !== '' ? <CustomText style={{marginTop: 8, textAlign: 'center' }}>{result}</CustomText> : <></>}
                                <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginTop: 16}}>
                                    <CustomText style={{fontSize: globalStyles.btnText.fontSize}}>¿Ya tienes tu código?</CustomText>
                                    <CustomButton 
                                        type='transparent' 
                                        label='Continuar' 
                                        style={{ paddingHorizontal: 0, paddingVertical: 0, marginLeft: 5 }}
                                        onPress={() => {navigation.navigate('SendCode')}}
                                    />
                                </View>
                            </View>
                        </View>
                    ) : (<ActivityIndicator size={'large'} color={globalColors.text} style={{marginTop: 56}} />)}
                </ScrollView>
            </KeyboardAvoidingView>
        </MainView>
    )
}

export default RequestCodeScreen