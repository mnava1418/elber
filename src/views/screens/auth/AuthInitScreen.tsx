import React, { useEffect } from 'react'
import { Animated, View } from 'react-native'
import useAnimateText from '../../../hooks/animations/useAnimateText'
import usePulseImage from '../../../hooks/animations/usePulseImage'
import { globalStyles } from '../../../styles/mainStyles'
import CustomButton from '../../components/ui/CustomButton'
import CustomText from '../../components/ui/CustomText'
import MainView from '../../components/ui/MainView'
import Title from '../../components/ui/Title'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { StackNavigationProps } from '../../Elber'

const logo = require('../../../assets/images/dot.png')

const AuthInitScreen = () => {
    const {animatedText, animateText} = useAnimateText()
    const {scaleImage, pulseImage} = usePulseImage(400, 1.1)
    const { bottom } = useSafeAreaInsets()
    
    useEffect(() => {
      animateText('Hola, Soy Elber', 50)
      pulseImage.start()

      return () => pulseImage.stop()
    }, [scaleImage])

    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    
    return (
        <MainView style={{justifyContent: 'space-between', alignItems:'center'}}>
            <View style={{flex: 1,  justifyContent: 'center', alignItems: 'center'}}>
                <Animated.Image 
                    source={logo} 
                    style={{height: 180, width: 180, resizeMode: 'contain', transform: [{scale: scaleImage}]}}
                    resizeMode='contain'
                />
                <Title style={{marginTop: 24, fontSize: 40}}>{animatedText}</Title>
                <CustomText style={{textAlign: 'center', marginHorizontal: 24, marginTop: 16}}>Bienvenido a tu asistente virtual. Estoy listo para ayudarte en todo lo que necesites.</CustomText>
            </View>
            <View style={{width: '100%', paddingBottom: bottom + 24}}>
                <CustomButton type='primary' label='Crea tu cuenta' onPress={() => {console.log('crear cuenta')}}/>
                <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginTop: 16}}>
                    <CustomText style={{fontSize: globalStyles.btnText.fontSize}}>¿Ya tienes cuenta?</CustomText>
                    <CustomButton 
                        type='transparent' 
                        label='Inicia sesión' 
                        style={{ paddingHorizontal: 0, paddingVertical: 0, marginLeft: 5 }}
                        onPress={() => {navigation.navigate('Login')}}
                    />
                </View>
            </View>
        </MainView>
    )
}

export default AuthInitScreen
