import { SOCKET_URL } from "@env"
import { io, Socket } from "socket.io-client"
import auth  from '@react-native-firebase/auth'
import * as elberService from "../services/elber.service"
import * as chatActions from '../store/actions/chat.actions'
import * as elberActions from '../store/actions/elber.actions'
import { NLPActions, NLPResponse } from "../interfaces/nlp.interface"

class SocketModel {
    private static instance: SocketModel
    private socket: Socket | null
    private connection_error_msg = 'Houston, tenemos un problema: no me puedo conectar al servidor.'   
    private response_error_msg = '¡Changos! Algo no jaló… fue culpa del becario imaginario, lo juro.' 
    
    constructor() {
        this.socket = null
    }

    static getInstance(): SocketModel {
        if(!SocketModel.instance) {
            SocketModel.instance = new SocketModel()
        }

        return SocketModel.instance
    }

    getSocket(): Socket | null {
        return this.socket
    }

    disconnect() {
        if(this.socket && this.socket.connected) {
            this.socket.disconnect()
        }
    }

    async connect(dispatch: (value: any) => void) {  
        if (!this.socket || !this.socket.connected) {
            const currentUser = auth().currentUser

            if(currentUser === null) {
                throw new Error('User not authenticated.');
            }                
            
            const token = await currentUser.getIdToken(true)

            this.socket = io(SOCKET_URL, {
                transports: ["websocket"],
                forceNew: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
                query: {token}
            });

            this.socket.on("connect", () => {
                console.info('Connected to socket:', this.socket!.id)                
                this.setListeners(dispatch)
            });

            this.socket.on("disconnect", () => {                
                console.info('Disconnected from socket...')
            });

            this.socket.on("connect_error", (err) => {                
                console.error('Error connecting to socket:', err.message);
            });
        } else {
            console.info('Socket already connected...')
        }
    }

    async sendMessage(dispatch: (value: any) => void, message: string, type: 'voice' | 'text') {        
        const currentUser = auth().currentUser
        const userMessage = elberService.generateChatMessage(message, 'user')
        dispatch(chatActions.setNewMessage(userMessage))
        dispatch(elberActions.setElberIsProcessing(true))

        if(this.socket && this.socket.connected && this.socket.id && currentUser) {               
            this.socket.emit('message-to-elber', currentUser.uid, message, type)
        } else {
            const elberResponse: NLPResponse = {
                action: type == 'text' ? NLPActions.SHOW_TEXT : NLPActions.PLAY_AUDIO,
                payload: {text: this.connection_error_msg, errorKey: 'connectionError'}
            }
            elberService.processElberResponse(dispatch, elberResponse, [])
        }
    }

    setListeners(dispatch: (value: any) => void) {
        this.setElberListeners(dispatch)
    }

    setElberListeners(dispatch: (value: any) => void) {
        if(this.socket && this.socket.connected && this.socket.id) {
            console.info('Setting Elber listeners...')

            let audioChunks: Uint8Array[] = []    

            this.socket.on('response-from-elber', (responseText: string) => {
                const elberResponse: NLPResponse = JSON.parse(responseText)
                elberService.processElberResponse(dispatch, elberResponse, audioChunks)
                audioChunks = []
            })

            this.socket.on('audio-chunk-elber', (chunk: Uint8Array) => {                
                audioChunks.push(chunk)
            })
        }
    }
}

export default SocketModel