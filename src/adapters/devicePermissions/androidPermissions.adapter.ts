import DevicePermissions from "./devicePermissions.adapter";
import { PERMISSIONS } from "react-native-permissions";

class AndroidPermissions extends DevicePermissions {
    async checkMicrophonePermission(): Promise<boolean> {
        const microphonePermission = await this.requestPermission(PERMISSIONS.ANDROID.RECORD_AUDIO)
        .catch(() => false)

        return microphonePermission
    }
    
    async checkSpeechRecognitionPermission(): Promise<boolean> {
        return true
    }
}

export default AndroidPermissions