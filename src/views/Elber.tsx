import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext, useEffect } from 'react'
import AuthInitScreen from './screens/auth/AuthInitScreen';
import HomeScreen from './screens/app/HomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import { GlobalContext } from '../store/GlobalState';
import { selectIsAuthenticated } from '../store/selectors/auth.selector';
import { globalColors } from '../styles/mainStyles';
import auth from '@react-native-firebase/auth'
import { setIsAuthenticated } from '../store/actions/auth.actions';
import RecoverScreen from './screens/auth/RecoverScreen';
import RequestCodeScreen from './screens/auth/signUp/RequestCodeScreen';
import SendCodeScreen from './screens/auth/signUp/SendCodeScreen';
import SignUpScreen from './screens/auth/signUp/SignUpScreen';
import WelcomeScreen from './screens/auth/signUp/WelcomeScreen';

export type StackNavigationProps = {
    /*1. AUTHENTICATION */
    AuthInit: undefined,
    Home: undefined,

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
                dispatch(setIsAuthenticated(true))
            } else {
                dispatch(setIsAuthenticated(false))
            }
        })

        return () => unsubscribe()
    }, [])
    
    return (
        <Stack.Navigator screenOptions={{headerShown: false, cardStyle: {backgroundColor: globalColors.primary}}}>
            {isAuthenticated ? (
                <Stack.Screen name='Home' component={HomeScreen} />
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