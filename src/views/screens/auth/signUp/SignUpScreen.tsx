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
import { CustomNavBtnProps } from '../../../../interfaces/ui.interface'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useSignUp from '../../../../hooks/auth/useSignUp'
import CustomError from '../../../../models/CustomError'
import { signUp } from '../../../../services/auth.service'

const SignUpScreen = () => {
    const {code} = useRoute<RouteProp<StackNavigationProps, 'SignUp'>>().params
    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const { top } = useSafeAreaInsets()
    const [isProcessing, setIsProcessing] = useState(false)

    const {
        name, setName,
        errors, setErrors,
        passwords, setPasswords,
        resetState
    } = useSignUp()

    const leftBtn: CustomNavBtnProps = {
        icon: 'chevron-back-outline',
        onPress: () => { navigation.goBack() }
    }

    const handleRequest = async () => {
        resetState()
        setIsProcessing(true)
        try {
            await signUp(code, name, passwords.newPwd, passwords.confirmPwd)
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
        <MainView>
            <CustomNavBar leftBtn={leftBtn} />
            <Subtitle style={{ marginTop: top + 56 }}>Completa tu registro</Subtitle>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={60}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                    <CustomText style={{marginTop: 20}}><CustomText style={{fontWeight: '700'}}>Paso 3:</CustomText> Completa el formulario para terminar tu registro. El correo electrónico que usaremos será el que proporcionaste al solicitar tu código de registro.</CustomText>
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Nombre</CustomText>
                    <TextInput
                        style={[globalStyles.input, { marginTop: 10 }]}
                        value={name}
                        onChangeText={setName}
                        keyboardType='email-address'
                        autoCapitalize='none'
                    />
                    {errors.name && errors.name.trim() !== '' ? <CustomText style={{ color: '#FF4C4C', marginTop: 8 }}>{errors.name}</CustomText> : <></>}
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Password</CustomText>
                    <TextInput
                        style={[globalStyles.input, { marginTop: 10 }]}
                        value={passwords.newPwd}
                        onChangeText={(e) => {setPasswords({...passwords, newPwd: e})}}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        secureTextEntry
                    />
                    {errors.password && errors.password.trim() !== '' ? <CustomText style={{ color: '#FF4C4C', marginTop: 8 }}>{errors.password}</CustomText> : <></>}
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Confirma tu password</CustomText>
                    <TextInput
                        style={[globalStyles.input, { marginTop: 10 }]}
                        value={passwords.confirmPwd}
                        onChangeText={(e) => {setPasswords({...passwords, confirmPwd: e})}}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        secureTextEntry
                    />
                    {!isProcessing ? (
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <CustomButton label='Registrar' type='primary' style={{ marginTop: 56 }} onPress={handleRequest} />
                            {errors.default && errors.default.trim() !== '' ? <CustomText style={{ color: '#FF4C4C', marginTop: 8 }}>{errors.default}</CustomText> : <></>}                        
                        </View>
                    ) : (<ActivityIndicator size={'large'} color={globalColors.text} style={{marginTop: 56}} />)}
                </ScrollView>
            </KeyboardAvoidingView>
        </MainView>
    )
}

export default SignUpScreen