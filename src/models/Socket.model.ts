import { BACK_URL } from "@env"
import { io, Socket } from "socket.io-client"

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

    connect() {
        if (!this.socket || !this.socket.connected) {
            this.socket = io(SOCKET_SERVER_URL, {
                transports: ["websocket"],
                forceNew: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
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
        } else {
            console.info('Already coonected to socket:', this.socket!.id)
        }
    }
}

export default SocketModel