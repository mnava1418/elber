import 'react-native-gesture-handler';
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import Elber from './views/Elber'

const App = () => {
  return (
    <NavigationContainer>
      <Elber />
    </NavigationContainer>
  )
}

export default App