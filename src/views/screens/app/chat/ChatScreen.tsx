import React, { useEffect, useState } from 'react'
import MainView from '../../../components/ui/MainView'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { MainScreenTapProps } from '../MainScreen'
import { CustomNavBtnProps } from '../../../../interfaces/ui.interface'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import ChatBtn from './ChatBtn'
import { chatStyles } from '../../../../styles/chatStyles'
import { ChatMessageType } from '../../../../interfaces/app.interface'
import ChatMessage from './ChatMessage'
import useChat from '../../../../hooks/app/useChat'
import { generateChatMessage, sendElberMessage } from '../../../../services/elber.service'

const ChatScreen = () => {
    const navigation = useNavigation<NavigationProp<MainScreenTapProps>>()
    const {top, bottom} = useSafeAreaInsets()
    
    const backBtn: CustomNavBtnProps = {
        icon: 'chevron-back-outline',
        onPress: () => { navigation.navigate('Home')}
    }

    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const {
        message, setMessage,
        inputState, setInputState,
        btnType, setBtnType,
        loading, setLoading,
    } = useChat()

    useEffect(() => {
        if (Platform.OS === 'android') {
          const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setInputState({...inputState, keyboardOffset: 60})
          });
          const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setInputState({...inputState, keyboardOffset: 0})
          });
    
          return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
          };
        }
    }, []);

    const sendMessage = async() => {
        if (message.trim() === '') return;

        setMessage('')
        setLoading(true)
        setMessages((prevMessages) => [generateChatMessage(message, 'user'), ...prevMessages]);

        const responseMessage = await sendElberMessage(message)
        .then(result => {
            return result
        })
        .catch(error => {
            return `Perdón mi hermano, está cosa tronó: ${(error as Error).message}`
        })

        setMessages((prevMessages) => [generateChatMessage(responseMessage, 'bot'), ...prevMessages]);
        setLoading(false)
    };

    return (
        <MainView>
            <CustomNavBar leftBtn={backBtn} title='Chat'/>
            <KeyboardAvoidingView
                style={[chatStyles.container, {marginBottom: bottom + 8, marginTop: top + 72}]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : inputState.keyboardOffset}
            >
            <FlatList
                data={messages}
                renderItem={({item}) => (
                    <ChatMessage message={item} />
                )}
                keyExtractor={(item) => item.id}
                inverted
                contentContainerStyle={{ paddingBottom: 10 }}
            />
            <View style={chatStyles.inputContainer}>
                <TextInput
                    style={[chatStyles.input, { height: inputState.height }]}
                    value={message}
                    onChangeText={(e) => {
                        if(e === '') {
                            setBtnType('outline')
                        } else {
                            setBtnType('primary')
                        }
                        setMessage(e)
                    }}
                    onFocus={() => {setMessage('')}}
                    multiline
                    onContentSizeChange={(event) => setInputState({...inputState, height: event.nativeEvent.contentSize.height})}
                    keyboardType='default'
                    autoCapitalize='sentences'
                    editable= {!loading}
                />
                {loading ? (
                    <ChatBtn type='primary' icon='ellipse' onPress={() => {}} />
                ) : (
                    <ChatBtn type={btnType} icon={btnType === 'primary' ? 'send' : 'camera-outline'} onPress={() => {
                        setBtnType('outline')
                        sendMessage()
                    }} />
                )}
            </View>
            </KeyboardAvoidingView>
         </MainView>
    )
}

export default ChatScreen