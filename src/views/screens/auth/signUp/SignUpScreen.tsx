import { useRoute, RouteProp, NavigationProp, useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native'
import { StackNavigationProps } from '../../../Elber'
import { globalColors, globalStyles } from '../../../../styles/mainStyles'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import CustomButton from '../../../components/ui/CustomButton'
import CustomText from '../../../components/ui/CustomText'
import MainView from '../../../components/ui/MainView'
import Subtitle from '../../../components/ui/Subtitle'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useSignUp from '../../../../hooks/auth/useSignUp'
import CustomError from '../../../../models/CustomError'
import { signUp } from '../../../../services/auth.service'
import NavBarBackBtn from '../../../components/navBar/NavBarBackBtn'
import CustomAlert from '../../../components/ui/CustomAlert'
import { AlertBtnProps } from '../../../../interfaces/ui.interface'
import Password from '../../../components/ui/Password'

const SignUpScreen = () => {
    const {code} = useRoute<RouteProp<StackNavigationProps, 'SignUp'>>().params
    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const { top } = useSafeAreaInsets()
    const [isProcessing, setIsProcessing] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const {
        name, setName,
        alertError, setAlertError,
        passwords, setPasswords,
        resetState
    } = useSignUp()

    const alertBtns: AlertBtnProps[] = [
        {
            label: 'Ok',
            type: 'default',
            action: () => {
                setAlertError('')
            }
        }
    ]

    const leftBtn = NavBarBackBtn(navigation)

    const handleRequest = async () => {
        resetState()
        setIsProcessing(true)
        try {
            const signedEmail = await signUp(code, name, passwords.newPwd, passwords.confirmPwd)
            navigation.navigate('Welcome', {name, email: signedEmail})
        } catch (error) {
            if (error instanceof CustomError) {
                setAlertError(error.message)
            } else {
                setAlertError('Error inesperado. Intenta nuevamente.')
            }
        } finally {
            setIsProcessing(false)
        }
    }
    
    return (
        <MainView>
            <CustomNavBar leftBtn={leftBtn} />
            <Subtitle style={{ marginTop: top + 56 }}>Completa tu registro</Subtitle>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={48}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                    <CustomText style={{marginTop: 20}}><CustomText style={{fontWeight: '700'}}>Paso 3:</CustomText> Completa el formulario para terminar tu registro. El correo electrónico que usaremos será el que proporcionaste al solicitar tu código de registro.</CustomText>
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Nombre</CustomText>
                    <TextInput
                        style={[globalStyles.input, { marginTop: 10 }]}
                        value={name}
                        onChangeText={setName}
                        keyboardType='default'
                        autoCapitalize='none'
                    />
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Password</CustomText>
                    <Password password={passwords.newPwd} setPassword={(arg0: string) => {setPasswords({...passwords, newPwd: arg0})}} />
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Confirma tu password</CustomText>
                    <Password password={passwords.confirmPwd} setPassword={(arg0: string) => {setPasswords({...passwords, confirmPwd: arg0})}} />
                    {!isProcessing ? (
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <CustomButton label='Registrar' type='primary' style={{ marginTop: 56 }} onPress={handleRequest} />
                        </View>
                    ) : (<ActivityIndicator size={'large'} color={globalColors.text} style={{marginTop: 56}} />)}
                </ScrollView>
            </KeyboardAvoidingView>
            <CustomAlert title='Registro' message={alertError} visible={alertError !== ''} alertBtns={alertBtns} />
        </MainView>
    )
}

export default SignUpScreen