import { Permission } from "react-native-permissions";

abstract class ElberPermissions {
    abstract requestPermission(ermission: Permission): Promise<boolean>
    abstract checkMicrophonePermission(): Promise<boolean>
    abstract checkSpeechRecognitionPermission(): Promise<boolean>
}

export default ElberPermissions