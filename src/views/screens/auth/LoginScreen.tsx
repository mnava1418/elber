import React, { useContext, useState } from 'react'
import MainView from '../../components/ui/MainView'
import { useNavigation, NavigationProp, RouteProp, useRoute } from '@react-navigation/native'
import { StackNavigationProps } from '../../Elber'
import CustomNavBar from '../../components/navBar/CustomNavBar'
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
import NavBarBackBtn from '../../components/navBar/NavBarBackBtn'
import CustomAlert from '../../components/ui/CustomAlert'
import { AlertBtnProps } from '../../../interfaces/ui.interface'
import Password from '../../components/ui/Password'

const LoginScreen = () => {
    const props = useRoute<RouteProp<StackNavigationProps, 'Login'>>().params
    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const { top } = useSafeAreaInsets()
    const {dispatch} = useContext(GlobalContext)
    const [showPassword, setShowPassword] = useState(false)
    
    const alertBtns: AlertBtnProps[] = [
        {
            label: 'Ok',
            type: 'default',
            action: () => {
                setAuthError('')
            }
        }
    ]

    const {
        email, setEmail,
        password, setPassword,
        isProcessing, setIsProcessing,
        authError, setAuthError
    } = useSignIn(props.email)

    const leftBtn = NavBarBackBtn(navigation)

    const handleSignIn = async () => {
        setAuthError('')
        setIsProcessing(true)

        try {
            await AuthServices.signIn(email, password)
            dispatch(setIsAuthenticated(true))
        } catch (error) {
            if (error instanceof CustomError) {                
                setAuthError(error.message)
            } else {
                setAuthError('Error inesperado. Intenta nuevamente.')
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
                keyboardVerticalOffset={40}
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
                    <CustomText style={{ fontSize: 22, marginTop: 24 }}>Password</CustomText>
                    <Password password={password} setPassword={(arg0: string) => {setPassword(arg0)}}/>
                    {!isProcessing ? (
                        <View style={{ width: '100%' }}>
                            <CustomButton label='Login' type='primary' style={{ marginTop: 56 }} onPress={handleSignIn} />
                            <View style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
                                <CustomButton label='¿Olvidaste tu contraseña?' type='transparent' style={{ marginTop: 16 }} onPress={() => {navigation.navigate('Recover', {originalEmail: email})}} />
                            </View>
                        </View>
                    ) : (<ActivityIndicator size={'large'} color={globalColors.text} style={{marginTop: 56}} />)}
                </ScrollView>
            </KeyboardAvoidingView>
            <CustomAlert title='Login' message={authError} visible={authError !== ''} alertBtns={alertBtns} />
        </MainView>
    )
}

export default LoginScreen
