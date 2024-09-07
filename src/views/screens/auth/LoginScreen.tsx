import React from 'react'
import MainView from '../../components/ui/MainView'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { StackNavigationProps } from '../../Elber'
import CustomNavBar from '../../components/navBar/CustomNavBar'
import { CustomNavBtnProps } from '../../../interfaces/ui.interface'
import Subtitle from '../../components/ui/Subtitle'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAvoidingView, ScrollView, TextInput, View } from 'react-native'
import CustomText from '../../components/ui/CustomText'
import { globalStyles } from '../../../styles/mainStyles'
import CustomButton from '../../components/ui/CustomButton'
import { Platform } from 'react-native'
import { fbAuthFetcher } from '../../../adapters/auth/fbFecther.adapter'
import * as AuthServices from '../../../services/auth.service'
import useSignIn from '../../../hooks/auth/useSignIn'
import CustomError from '../../../models/CustomError'

const LoginScreen = () => {
    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const {top} = useSafeAreaInsets()

    const {
        email, setEmail, emailError, setEmailError,
        password, setPassword, passwordError, setPasswordError,
        signInError, setSignInError,
        isProcessing, setIsProcessing,
        clearErrors
    } = useSignIn()

    const leftBtn: CustomNavBtnProps = {
        icon: 'chevron-back-outline',
        onPress: () => {navigation.goBack()}
    }

    const handleSignIn = async() => {
        try {
            clearErrors()
            setIsProcessing(true)
            await AuthServices.signIn(fbAuthFetcher, email, password)
            setIsProcessing(false)
          } catch (error) {
            setIsProcessing(false)
            if(error instanceof CustomError) {
                handleErrors(error)
            } else {
                setSignInError('Error inesperado. Intenta nuevamente.')
            }
          }
    }

    const handleErrors = (error: CustomError) => {
        if(error.type === 'email') {
            setEmailError(error.message)
        } else if(error.type === 'password') {
            setPasswordError(error.message)
        } else {
            setSignInError(error.message)
        }
    }

    return (
         <MainView>     
            <CustomNavBar leftBtn={leftBtn} />
            <Subtitle style={{marginTop: top + 56}}>Bienvenido, que gusto verte de nuevo.</Subtitle>
            <KeyboardAvoidingView 
                style={{flex: 1}} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={60}
            >
                <ScrollView contentContainerStyle={{flexGrow: 1}} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                    <CustomText style={{fontSize: 22, marginTop: 24}}>Email</CustomText>
                    <TextInput 
                        style={[globalStyles.input, {marginTop: 10}]} 
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                    />
                    {emailError && emailError.trim() !== '' ? <CustomText style={{color: '#FF4C4C', marginTop: 8}}>{emailError}</CustomText> : <></>}
                    <CustomText style={{fontSize: 22, marginTop: 24}}>Password</CustomText>
                    <TextInput 
                        style={[globalStyles.input, {marginTop: 10}]} 
                        value={password}
                        onChangeText={setPassword}
                        keyboardType='default'
                        autoCapitalize='none'
                        secureTextEntry
                    />
                    {passwordError && passwordError.trim() !== '' ? <CustomText style={{color: '#FF4C4C', marginTop: 8}}>{passwordError}</CustomText> : <></>}
                    {!isProcessing ? (
                        <View style={{width: '100%'}}>
                            <CustomButton label='Login' type='primary' style={{marginTop: 56}} onPress={handleSignIn} />
                            <View style={{flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center'}}>
                                {signInError && signInError.trim() !== '' ? <CustomText style={{color: '#FF4C4C', marginTop: 8}}>{signInError}</CustomText> : <></>}
                                <CustomButton label='¿Olvidaste tu password?' type='transparent' style={{marginTop: 16}} onPress={() => {}}/>
                            </View>
                        </View>
                    ) : (<></>)}
                </ScrollView>
            </KeyboardAvoidingView>
        </MainView>
    )
}

export default LoginScreen
