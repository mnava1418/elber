import React from 'react'
import MainView from '../../../components/ui/MainView'
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native'
import { StackNavigationProps } from '../../../Elber'
import Title from '../../../components/ui/Title'
import Subtitle from '../../../components/ui/Subtitle'
import CustomText from '../../../components/ui/CustomText'
import CustomButton from '../../../components/ui/CustomButton'

const WelcomeScreen = () => {
    const {name, email} = useRoute<RouteProp<StackNavigationProps, 'Welcome'>>().params
    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()

    return (
        <MainView showBgImage style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <Title>{`¡Hola ${name}!`}</Title>
            <Subtitle style={{marginTop: 40}}>Tu cuenta ha sido creada.</Subtitle>
            <CustomText style={{marginTop: 16, textAlign: 'center'}}>{`Hemos enviado un correo de verificación a ${email}. Verifica tu cuenta para poder iniciar sesión.`}</CustomText>
            <CustomButton style={{marginTop: 80}} label='Inicia sesión' type='primary' onPress={() => {navigation.navigate('Login', {email})}}/>
        </MainView>
    )
}

export default WelcomeScreen