import { NavigationProp } from "@react-navigation/native"
import { CustomNavBtnProps } from "../../../interfaces/ui.interface"
import { StackNavigationProps } from "../../Elber"

const NavBarBackBtn = (navigation: NavigationProp<any>): CustomNavBtnProps => {
  return {
    icon: 'chevron-back-outline',
    onPress: () => { navigation.goBack() }
  }
}

export default NavBarBackBtn