import { Platform } from "react-native"
import { checkCamaraPermissions } from "./entitlements.service"
import * as elberActions from '../store/actions/elber.actions'
import { launchCamera } from "react-native-image-picker"

export const openCamera = async(dispatch: (value: any) => void) => {    
    dispatch(elberActions.setElberIsProcessing(false))

    const hasCameraPermissions = await checkCamaraPermissions(Platform.OS === 'ios' ? 'ios' : 'android')
            .catch(() => false)
    
    if (hasCameraPermissions) {
        launchCamera({
            mediaType: 'photo',
            saveToPhotos: false,
            cameraType: 'back'
        }, (response) => {
            if (response.didCancel) {
                return
            } else if (response.errorCode) {
                console.error('Camera Code:', response.errorCode, response.errorMessage)                
            } else {
                console.log('Se tomo la foto')
            }
        })
    } else {
        dispatch(elberActions.setEntitlementsAlert({
            isVisible: true,
            title: 'Cámara',
            text: 'Elber necesita acceso a tu cámara para saber que estás viendo. Ve a Configuración y habilítalos'
        }))
    }
}
