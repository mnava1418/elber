import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext, useEffect } from 'react'
import AuthInitScreen from './screens/auth/AuthInitScreen';
import LoginScreen from './screens/auth/LoginScreen';
import { GlobalContext } from '../store/GlobalState';
import { selectIsAuthenticated } from '../store/selectors/auth.selector';
import { globalColors } from '../styles/mainStyles';
import auth from '@react-native-firebase/auth'
import { setAuthenticatedUser, setIsAuthenticated } from '../store/actions/auth.actions';
import RecoverScreen from './screens/auth/RecoverScreen';
import RequestCodeScreen from './screens/auth/signUp/RequestCodeScreen';
import SendCodeScreen from './screens/auth/signUp/SendCodeScreen';
import SignUpScreen from './screens/auth/signUp/SignUpScreen';
import WelcomeScreen from './screens/auth/signUp/WelcomeScreen';
import MainScreen from './screens/app/MainScreen';
import SocketModel from '../models/Socket.model';

export type StackNavigationProps = {
    /*1. AUTHENTICATION */
    AuthInit: undefined,
    Main: undefined,

    /*1.1 LOGIN */
    Login: {email: string},
    Recover: {originalEmail: string},

    /*1.2 SIGNUP */
    RequestCode: undefined,
    SendCode: undefined,
    SignUp: {code: string}
    Welcome: {name: string, email: string}
}

const Stack = createStackNavigator<StackNavigationProps>();

const Elber = () => {
    const {state, dispatch} = useContext(GlobalContext)
    const isAuthenticated = selectIsAuthenticated(state.auth)

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged((user) => {
            if(user && user.emailVerified) {
                SocketModel.getInstance().connect()
                dispatch(setIsAuthenticated(true))
                dispatch(setAuthenticatedUser({email: user.email || '', name: user.displayName || ''}))
            } else {
                dispatch(setIsAuthenticated(false))
            }
        })

        return () => unsubscribe()
    }, [])
    
    return (
        <Stack.Navigator screenOptions={{headerShown: false, cardStyle: {backgroundColor: globalColors.background}}}>
            {isAuthenticated ? (
                <Stack.Screen name='Main' component={MainScreen} />
            ) : (
                <>
                    <Stack.Screen name='AuthInit' component={AuthInitScreen} />
                    <Stack.Screen name='Login' component={LoginScreen} />
                    <Stack.Screen name='Recover' component={RecoverScreen}/>
                    <Stack.Screen name='RequestCode' component={RequestCodeScreen}/>
                    <Stack.Screen name='SendCode' component={SendCodeScreen}/>
                    <Stack.Screen name='SignUp' component={SignUpScreen}/>
                    <Stack.Screen name='Welcome' component={WelcomeScreen}/>
                </>
            )}
        </Stack.Navigator>
    )
}

export default Elber