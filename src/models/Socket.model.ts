import { BACK_URL } from "@env"
import { io, Socket } from "socket.io-client"
import auth  from '@react-native-firebase/auth'
import * as elberService from "../services/elber.service"

const SOCKET_SERVER_URL = `${BACK_URL}:4042`

class SocketModel {
    private static instance: SocketModel
    private socket: Socket | null

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

    async connect(dispatch: (value: any) => void) {        
        if (!this.socket || !this.socket.connected) {
            const currentUser = auth().currentUser

            if(currentUser === null) {
                throw new Error('User not authenticated.');
            }    
            
            const token = await currentUser.getIdToken(true)

            this.socket = io(SOCKET_SERVER_URL, {
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
        await this.connect(dispatch)
        const currentUser = auth().currentUser

        if(this.socket && currentUser) {
            this.socket.emit('message-to-elber', currentUser.uid, message, type)
        }
    }

    setListeners(dispatch: (value: any) => void) {
        this.setTextListeners(dispatch)
        this.setAudioListeners()
    }

    setTextListeners(dispatch: (value: any) => void) {
        if(this.socket) {
            console.info('Setting text listeners...')
            this.socket.on('text-response-elber', (responseText) => {
                elberService.processTextResponse(dispatch, responseText)
            })
        }
    }

    setAudioListeners() {
        if(this.socket) {
            console.info('Setting audio listeners...')
            let audioChunks: Uint8Array[] = []    
    
            this.socket.on('audio-chunk-elber', (chunk: Uint8Array) => {                
                audioChunks.push(chunk)
            })

            this.socket.on('audio-end-elber', async () => {
                try {
                    await elberService.processAudioResponse(audioChunks)
                } catch (error) {
                    console.error(error)
                } finally {
                    audioChunks = []
                }
            })

            this.socket.on('audio-error-elber', async () => {
                console.log('recibiendo error de audio')
            })
        }
    }
}

export default SocketModel