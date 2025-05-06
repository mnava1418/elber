import React, { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { globalColors, globalStyles } from '../../../styles/mainStyles'
import AppIcon from './AppIcon'

type PasswordFields = {
    password: string,
    setPassword: (arg0: string) => void
}

const Password = ({password, setPassword}: PasswordFields) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <View style={[globalStyles.input, { marginTop: 10, flexDirection: 'row', alignItems: 'center'}]}>
            <TextInput
                style={{height: 48, fontSize: 18, color: '#000', flex: 1, marginRight: 10}}
                value={password}
                onChangeText={(e) => {setPassword(e)}}
                keyboardType='default'
                autoCapitalize='none'
                secureTextEntry= {!showPassword}
            />
            <Pressable
                style={({pressed}) => ([
                    {opacity: pressed ? 0.8 : 1.0}
                    ]
                )}
                onPress={() => {setShowPassword(prev => !prev)}}
            >
                <AppIcon name={ showPassword ? 'eye' : 'eye-off'} size={32} color={globalColors.primary} />
            </Pressable>
        </View>
    )
}

export default Password