export type ChatMessageType = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}