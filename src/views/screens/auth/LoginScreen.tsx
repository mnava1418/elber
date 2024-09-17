import React, { useContext } from 'react'
import MainView from '../../components/ui/MainView'
import { useNavigation, NavigationProp, RouteProp, useRoute } from '@react-navigation/native'
import { StackNavigationProps } from '../../Elber'
import CustomNavBar from '../../components/navBar/CustomNavBar'
import { CustomNavBtnProps } from '../../../interfaces/ui.interface'
import Subtitle from '../../components/ui/Subtitle'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, TextInput, View } from 'react-native'
import CustomText from '../../components/ui/CustomText'
import { globalColors, globalStyles } from '../../../styles/mainStyles'
import CustomButton from '../../components/ui/CustomButton'
import { Platform } from 'react-native'
import * as AuthServices from '../../../services/auth.service'
import useSignIn from '../../../hooks/auth/useSignIn'
import CustomError from '../../../models/CustomError'
import { GlobalContext } from '../../../store/GlobalState'
import { setIsAuthenticated } from '../../../store/actions/auth.actions'

const LoginScreen = () => {
    const props = useRoute<RouteProp<StackNavigationProps, 'Login'>>().params
    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const { top } = useSafeAreaInsets()
    const {dispatch} = useContext(GlobalContext)

    const {
        email, setEmail,
        password, setPassword,
        isProcessing, setIsProcessing,
        authErrors, setAuthErrors
    } = useSignIn(props.email)

    const leftBtn: CustomNavBtnProps = {
        icon: 'chevron-back-outline',
        onPress: () => { navigation.goBack() }
    }

    const handleSignIn = async () => {
        setAuthErrors({default: '', email: '', password: ''})
        setIsProcessing(true)

        try {
            await AuthServices.signIn(email, password)
            dispatch(setIsAuthenticated(true))
        } catch (error) {
            if (error instanceof CustomError) {
                setAuthErrors((prevErrors) => ({...prevErrors, [error.type]: error.message}))
            } else {
                setAuthErrors((prevErrors) => ({...prevErrors, default: 'Error inesperado. Intenta nuevamente.'}))
            }
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <MainView>
            <CustomNavBar leftBtn={leftBtn} />
            <Subtitle style={{ marginTop: top + 56 }}>Bienvenido, que gusto verte de nuevo.</Subtitle>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={60}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Email</CustomText>
                    <TextInput
                        style={[globalStyles.input, { marginTop: 10 }]}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                    />
                    {authErrors.email && authErrors.email.trim() !== '' ? <CustomText style={{ color: '#FF4C4C', marginTop: 8 }}>{authErrors.email}</CustomText> : <></>}
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Password</CustomText>
                    <TextInput
                        style={[globalStyles.input, { marginTop: 10 }]}
                        value={password}
                        onChangeText={setPassword}
                        keyboardType='default'
                        autoCapitalize='none'
                        secureTextEntry
                    />
                    {authErrors.password && authErrors.password.trim() !== '' ? <CustomText style={{ color: '#FF4C4C', marginTop: 8 }}>{authErrors.password}</CustomText> : <></>}
                    {!isProcessing ? (
                        <View style={{ width: '100%' }}>
                            <CustomButton label='Login' type='primary' style={{ marginTop: 56 }} onPress={handleSignIn} />
                            <View style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
                                {authErrors.default && authErrors.default.trim() !== '' ? <CustomText style={{ color: '#FF4C4C', marginTop: 8 }}>{authErrors.default}</CustomText> : <></>}
                                <CustomButton label='¿Olvidaste tu contraseña?' type='transparent' style={{ marginTop: 16 }} onPress={() => {navigation.navigate('Recover', {originalEmail: email})}} />
                            </View>
                        </View>
                    ) : (<ActivityIndicator size={'large'} color={globalColors.text} style={{marginTop: 56}} />)}
                </ScrollView>
            </KeyboardAvoidingView>
        </MainView>
    )
}

export default LoginScreen
