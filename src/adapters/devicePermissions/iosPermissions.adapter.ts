import { PERMISSIONS } from "react-native-permissions";
import DevicePermissions from "./devicePermissions.adapter";

class IosPermissions extends DevicePermissions {
    async checkMicrophonePermission(): Promise<boolean> {
        const microphonePermission = await this.requestPermission(PERMISSIONS.IOS.MICROPHONE)
        .catch(() => false)

        return microphonePermission
    }
    
    async checkSpeechRecognitionPermission(): Promise<boolean> {
        const speechRecognitionPermission = await this.requestPermission(PERMISSIONS.IOS.SPEECH_RECOGNITION)
        .catch(() => false)

        return speechRecognitionPermission
    }

    async checkCameraPermission(): Promise<boolean> {
        const cameraPermission = await this.requestPermission(PERMISSIONS.IOS.CAMERA)
        .catch(() => false)

        return cameraPermission
    }
}

export default IosPermissions