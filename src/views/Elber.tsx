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

export type StackNavigationProps = {
    AuthInit: undefined,
    Home: undefined,
    Login: undefined
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
                </>
            )}
        </Stack.Navigator>
    )
}

export default Elber