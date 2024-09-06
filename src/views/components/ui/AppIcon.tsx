import Icon from 'react-native-vector-icons/Ionicons'
import { globalColors } from '../../../styles/mainStyles'

type AppIconPros = {
    name: string,
    color?: string,
    size?: number
}

const AppIcon = ({name, color = globalColors.text, size = 40}: AppIconPros) => {
    return (
        <Icon name={name} color={color} size={size} />
    )
}

export default AppIcon