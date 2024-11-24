import React, { useContext, useEffect, useRef, useState } from 'react'
import MainView from '../../../components/ui/MainView'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { MainScreenTapProps } from '../MainScreen'
import { AlertBtnProps, CustomNavBtnProps } from '../../../../interfaces/ui.interface'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActivityIndicator, FlatList, Image, Keyboard, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, TextInput, View } from 'react-native'
import ChatBtn from './ChatBtn'
import { chatStyles } from '../../../../styles/chatStyles'
import ChatMessage from './ChatMessage'
import useChat from '../../../../hooks/app/useChat'
import * as elberService from '../../../../services/elber.service'
import { GlobalContext } from '../../../../store/GlobalState'
import { selectChatHistory } from '../../../../store/selectors/chat.selector'
import * as chatActions from '../../../../store/actions/chat.actions'
import { ChatHistoryResponse } from '../../../../interfaces/http.interface'
import { globalColors } from '../../../../styles/mainStyles'
import useChatHistory from '../../../../hooks/app/useChatHistory'
import CustomAlert from '../../../components/ui/CustomAlert'
import ChatActions from './ChatActions'
import Subtitle from '../../../components/ui/Subtitle'

const logo = require('../../../../assets/images/dot.png')

const ChatScreen = () => {
    const navigation = useNavigation<NavigationProp<MainScreenTapProps>>()
    const {top, bottom} = useSafeAreaInsets()
    const {state, dispatch} = useContext(GlobalContext)
    const {chatMessages, lastKey, showFavorites} = selectChatHistory(state.chat)
    const [modalVisible, setModalVisible] = useState(false)
    
    const [actionVisible, setActionVisible] = useState(false)
    const flatListRef = useRef<FlatList>(null)
    const [isNewMessage, setIsNewMessage] = useState(false)
    
    const backBtn: CustomNavBtnProps = {
        icon: 'chevron-back-outline',
        onPress: () => { navigation.navigate('Home')}
    }

    const favoriteBtn: CustomNavBtnProps = {
        icon: showFavorites ? 'star' : 'star-outline',
        onPress: () => {
            dispatch(chatActions.setShowFavorites())
        },
        style: {marginRight: 16}
    }    

    const deleteBtn: CustomNavBtnProps = {
        icon: 'trash-outline',
        onPress: () => {
            if(chatMessages.length > 0) {
                setModalVisible(true)
            }
        },
        style: {marginRight: 16}
    }    

    const {
        isLoadingHistory, setIsLoadingHistory, 
        isLoadingMessages
    } = useChatHistory()
    
    const {
        message, setMessage,
        inputState, setInputState,
        btnType, setBtnType,
        loading, setLoading,
    } = useChat()

    const alertBtns: AlertBtnProps[] = [
        {
            type: 'default',
            label: 'Continuar',
            action: () => {
                setModalVisible(false)
                elberService.deleteMessages()
                .then(() => {
                    dispatch(chatActions.deleteAllMessages())
                })
                .catch((error: Error) => {
                    console.error(error.message)
                })
            }
        },
        {
            type: 'cancel',
            label: 'Cancelar',
            action: () => {
                setModalVisible(false)
            }
        }
    ]

    useEffect(() => {
        if(chatMessages.length === 0) {
            setIsNewMessage(false)
            elberService.loadChatMessages()
            .then((response: ChatHistoryResponse) => {
                dispatch(chatActions.setChatMessages(response.messages))
                dispatch(chatActions.setLastKey(response.messages.length > 0 ? response.lastKey : null))
                setIsLoadingHistory(false)
            })
            .catch((error: Error) => {
                console.error(error.message)
            })
        } else {
            setIsLoadingHistory(false)
        }

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

        const userMessage = elberService.generateChatMessage(message, 'user')
        dispatch(chatActions.setNewMessage(userMessage))

        const botMessage = await elberService.sendElberMessage(userMessage)
        .then(result => {
            return elberService.generateChatMessage(result.responseText, 'bot', false, result.id)
        })
        .catch(error => {
            return elberService.generateChatMessage(`Perdón mi hermano, está cosa tronó: ${(error as Error).message}`, 'bot')
        })

        dispatch(chatActions.setNewMessage(botMessage))
        setLoading(false)
    };

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if ( isLoadingMessages.current || lastKey === null ) return;
        
        const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
        const isEndReached = ( contentOffset.y + layoutMeasurement.height ) >= contentSize.height - 20
        if ( !isEndReached ) return;

        isLoadingMessages.current = true
        
        elberService.loadChatMessages(lastKey)
        .then((response: ChatHistoryResponse) => {
            dispatch(chatActions.setChatMessages(response.messages))
            dispatch(chatActions.setLastKey(response.messages.length > 0 ? response.lastKey : null))
            setTimeout(() => {
                isLoadingMessages.current = false
            }, 500);
        })
        .catch((error: Error) => {
            console.error(error.message)
        })
    }

    const scrollToMessage = (index: number) => {
        flatListRef.current?.scrollToIndex({
            index: index,
            animated: true
        })
    }

    const getChatHistory = () => (
        <FlatList
                ref={flatListRef}
                inverted
                data={chatMessages}
                renderItem={({item, index}) => (
                    <ChatMessage key={index} index={index} message={item} isNewMessage={isNewMessage} showActions={setActionVisible} scrollToMessage={scrollToMessage} />
                )}
                keyExtractor={(item,index) => `${item.id}-${index}`}
                contentContainerStyle={{ paddingBottom: 10 }}
                onScroll={onScroll}
                showsVerticalScrollIndicator={false}
            />
    )

    const getWelcomeView = () => (
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <Image style={{width: 150, height: 150, marginBottom: 24}} source={logo}/>
            <Subtitle>¿En qué puedo ayudarte hoy?</Subtitle>            
        </View>
    )

    const getChatView = () => (
        <KeyboardAvoidingView
                style={[chatStyles.container, {marginBottom: bottom + 8, marginTop: top + 72}]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : inputState.keyboardOffset}
            >
            {chatMessages.length > 0 ? getChatHistory() : getWelcomeView()}
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
                    editable= {!showFavorites}
                />
                {loading ? (
                    <ChatBtn type='primary' icon='ellipse' onPress={() => {}} />
                ) : (
                    <ChatBtn type={btnType} icon={btnType === 'primary' ? 'send' : 'camera-outline'} onPress={() => {
                        setBtnType('outline')
                        setIsNewMessage(true)

                        if(chatMessages.length > 0) {
                            scrollToMessage(0)
                        }
                                                
                        sendMessage()
                    }} />
                )}
            </View>
        </KeyboardAvoidingView>
    )

    return (
        <MainView>
            <CustomNavBar leftBtn={backBtn} title='Chat' rightBtns={[favoriteBtn, deleteBtn]}/>
            {isLoadingHistory ? (
                <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size={'large'} color={globalColors.text} />
                </View>
            ) : (
                getChatView()
            )}
            <CustomAlert title='Borrar Mensajes' message='¿Estás seguro de querer vaciar tu chat?' alertBtns={alertBtns} visible={modalVisible} />
            <ChatActions visible={actionVisible} setVisible={setActionVisible}/>
         </MainView>
    )
}

export default ChatScreen