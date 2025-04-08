import { BACK_URL } from "@env"
import { io, Socket } from "socket.io-client"
import auth  from '@react-native-firebase/auth'

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

    async connect() {
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
            });

            this.socket.on("disconnect", () => {
                console.info('Disconnected from socket...')
            });

            this.socket.on("connect_error", (err) => {
                console.error('Error connecting to socket:', err.message);
            });
        }
    }

    async sendMessage(message: string) {
        await this.connect()
        const currentUser = auth().currentUser

        if(this.socket && currentUser) {
            this.socket.emit('message-to-elber', currentUser.uid, message)
        }
    }
}

export default SocketModel