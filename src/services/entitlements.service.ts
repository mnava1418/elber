import AndroidPermissions from "../adapters/devicePermissions/androidPermissions.adapter";
import DevicePermissions from "../adapters/devicePermissions/devicePermissions.adapter";
import IosPermissions from "../adapters/devicePermissions/iosPermissions.adapter";
import { setAuthPermissions } from "../store/actions/auth.actions";

export const checkDevicePermissions = async (dispatch: React.Dispatch<any>, os: 'ios' | 'android') => {
    let devicePermissions: DevicePermissions;

    if(os === 'ios') {
        devicePermissions = new IosPermissions()
    } else {
        devicePermissions = new AndroidPermissions()
    }

    const microphonePermission:boolean = await devicePermissions.checkMicrophonePermission()
    .catch(() => false)    
    
    const speechRecognitionPermission: boolean = await devicePermissions.checkSpeechRecognitionPermission()
    .catch(() => false)    

    dispatch(setAuthPermissions({microphonePermission, speechRecognitionPermission}))
}