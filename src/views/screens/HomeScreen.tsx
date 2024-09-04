import React, { useEffect } from 'react'
import { Image, View } from 'react-native'
import MainView from '../components/ui/MainView'
import Title from '../components/ui/Title'
import useAnimations from '../../hooks/useAnimations'
import CustomButton from '../components/ui/CustomButton'
import { globalStyles } from '../../styles/mainStyles'
import CustomText from '../components/ui/CustomText'

const logo = require('../../assets/images/dot.png')

const HomeScreen = () => {
    const {animatedText, animateText} = useAnimations()
    
    useEffect(() => {
      animateText('Hola, Soy Elber', 50)
    }, [])
    
    return (
        <MainView style={{justifyContent: 'space-between', alignItems:'center'}}>
            <View style={{flex: 1,  justifyContent: 'center', alignItems: 'center'}}>
                <Image source={logo} style={{height: 180, width: 180, resizeMode: 'contain'}} />
                <Title style={{marginTop: 24, fontSize: 40}}>{animatedText}</Title>
                <CustomText style={{textAlign: 'center', marginHorizontal: 24, marginTop: 16}}>Bienvenido a tu asistente virtual. Estoy listo para ayudarte en todo lo que necesites.</CustomText>
            </View>
            <View style={{width: '100%', marginBottom: 72}}>
                <CustomButton type='primary' label='Crea tu cuenta'/>
                <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginTop: 16}}>
                    <CustomText style={{fontSize: globalStyles.btnText.fontSize}}>¿Ya tienes cuenta?</CustomText>
                    <CustomButton type='transparent' label='Inicia sesión' style={{ paddingHorizontal: 0, paddingVertical: 0, marginLeft: 5 }}/>
                </View>
            </View>
        </MainView>
    )
}

export default HomeScreen
