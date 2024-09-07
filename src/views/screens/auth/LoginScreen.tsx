import React, { useState } from 'react'
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

const LoginScreen = () => {
    const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
    const {top} = useSafeAreaInsets()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const leftBtn: CustomNavBtnProps = {
        icon: 'chevron-back-outline',
        onPress: () => {navigation.goBack()}
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
                    <CustomText style={{fontSize: 22, marginTop: 24}}>Password</CustomText>
                    <TextInput 
                        style={[globalStyles.input, {marginTop: 10}]} 
                        value={password}
                        onChangeText={setPassword}
                        keyboardType='default'
                        autoCapitalize='none'
                        secureTextEntry
                    />
                    <CustomButton label='Login' type='primary' style={{marginTop: 56}} onPress={() => {}} />
                    <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                        <CustomButton label='¿Olvidaste tu password?' type='transparent' style={{marginTop: 16}} onPress={() => {}}/>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </MainView>
    )
}

export default LoginScreen
