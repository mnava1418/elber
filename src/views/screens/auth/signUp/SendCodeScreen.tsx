import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native'
import { globalStyles } from '../../../../styles/mainStyles'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import CustomButton from '../../../components/ui/CustomButton'
import CustomText from '../../../components/ui/CustomText'
import MainView from '../../../components/ui/MainView'
import Subtitle from '../../../components/ui/Subtitle'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomNavBtnProps } from '../../../../interfaces/ui.interface'
import { StackNavigationProps } from '../../../Elber'
import useSignUp from '../../../../hooks/auth/useSignUp'

const SendCodeScreen = () => {
  const navigation = useNavigation<NavigationProp<StackNavigationProps>>()
  const { top } = useSafeAreaInsets()
  
  const leftBtn: CustomNavBtnProps = {
      icon: 'chevron-back-outline',
      onPress: () => { navigation.goBack() }
  }

  const {
    code, setCode,
    errors, setErrors,
    resetState
  } = useSignUp()

  const handleRequest = () => {
    resetState()
    if(code.trim() === '') {
      setErrors((prev) => ({...prev, default: 'El código de registro es obligatorio.'}))
    } else {
      navigation.navigate('SignUp', {code})
    }
  }

  return (
      <MainView>
            <CustomNavBar leftBtn={leftBtn} />
            <Subtitle style={{ marginTop: top + 56 }}>Código de registro</Subtitle>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={60}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                    <CustomText style={{marginTop: 20}}><CustomText style={{fontWeight: '700'}}>Paso 2:</CustomText> Proporciona el código de registro que recibiste por correo electrónico.</CustomText>
                    <TextInput
                      style={[globalStyles.textArea, {marginTop: 24}]}
                      value={code}
                      onChangeText={setCode}
                      keyboardType='email-address'
                      autoCapitalize='none'
                      multiline={true}
                      numberOfLines={15}
                      textAlignVertical="top"
                    />
                    {errors.default && errors.default.trim() !== '' ? <CustomText style={{ color: '#FF4C4C', marginTop: 8 }}>{errors.default}</CustomText> : <></>}
                    <CustomButton label='Continuar' type='primary' style={{ marginTop: 56 }} onPress={handleRequest} />
                </ScrollView>
            </KeyboardAvoidingView>
        </MainView>
    
  )
}

export default SendCodeScreen