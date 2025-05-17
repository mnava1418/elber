import { AudioErrorKey } from "./app.interface"

export enum NLPActions {
    SHOW_TEXT = 'show_text',
    PLAY_AUDIO = 'play_audio'
}

export type GeneralPayload = {
    text: string,
    errorKey?: AudioErrorKey
}

export type NLPResponse = {
    action: NLPActions,
    payload: GeneralPayload
}