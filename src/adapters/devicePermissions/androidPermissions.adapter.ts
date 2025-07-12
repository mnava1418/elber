import { Platform } from "react-native";
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

    async checkCameraPermission(): Promise<boolean> {
        const cameraPermission = await this.requestPermission(PERMISSIONS.ANDROID.CAMERA)
        .catch(() => false)
        
        return cameraPermission
    }

    async checkPhotoLibraryPermission(): Promise<boolean> {
        let photoLibraryPermission = false
        if (Platform.Version as number >= 33 ) {
            photoLibraryPermission = await this.requestPermission(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES)
            .catch(() => false)
        } else {
            photoLibraryPermission = await this.requestPermission(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE)
            .catch(() => false)
        }

        return photoLibraryPermission
    }
}

export default AndroidPermissions