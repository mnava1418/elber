import { ChatMessageType } from "./app.interface"

export type SimpleHttpResponse = {
    message: string
}

export type SigUpResponse = {
    message:string
    email:string
}

export type ElberResponse = {
    intentName:string 
    responseText:string
    id: string
}

export type ChatHistoryResponse = {
    messages: {[key:string]: ChatMessageType},
    lastKey: string | null
}
