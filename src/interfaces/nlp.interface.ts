import { AudioErrorKey } from "./app.interface"

export enum NLPActions {
    SHOW_TEXT = 'show_text',
    PLAY_AUDIO = 'play_audio',
    OPEN_CAMERA = 'open_camera',
}

export type GeneralPayload = {
    text: string,
    errorKey?: AudioErrorKey
}

export type NLPResponse = {
    action: NLPActions,
    payload: GeneralPayload
}