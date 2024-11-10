import React, { createContext, ReactNode, useReducer } from 'react'
import { authReducer, AuthState, initialAuthState } from './reducers/auth.reducer';
import { chatReducer, ChatState, initialChatState } from './reducers/chat.reducer';

type GlobalProviderProps = {
  children: ReactNode;
}

type State = {
  auth: AuthState
  chat: ChatState
}

const initialState: State = {
  auth: initialAuthState,
  chat: initialChatState
}

const rootReducer = ({auth, chat}: State, action: any): State => ({
  auth: authReducer(auth, action),
  chat: chatReducer(chat, action)
});

export const GlobalContext = createContext<{state: State, dispatch: React.Dispatch<any>}>({state: initialState, dispatch: () => null})

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(rootReducer, initialState);

  return (
    <GlobalContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalContext.Provider>
  );
};