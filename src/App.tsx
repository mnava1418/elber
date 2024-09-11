import 'react-native-gesture-handler';
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import Elber from './views/Elber'
import { GlobalProvider } from './store/GlobalState';

const App = () => {
  return (
    <GlobalProvider>
      <NavigationContainer>
        <Elber />
      </NavigationContainer>
    </GlobalProvider>
  )
}

export default App