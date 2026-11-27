import RNMaskedView from '@react-native-masked-view/masked-view'
import type { ComponentType, ReactElement } from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'
import { gradients } from '../theme'
import Text, { type TextProps } from './Text'

// The package's class typings don't fit React 19's JSX types; the component itself works.
const MaskedView = RNMaskedView as unknown as ComponentType<ViewProps & { maskElement: ReactElement }>

// The web clips the brand gradient to the text (background-clip: text). React
// Native can't, so the text is used as a mask over a view painted with the
// gradient. The invisible copy underneath gives the view its size.
export default function GradientText({ children, ...rest }: Omit<TextProps, 'color'>) {
  return (
    <MaskedView maskElement={<Text {...rest}>{children}</Text>}>
      <View style={styles.gradient}>
        {/* Also the copy screen readers read: the mask isn't accessible. */}
        <Text {...rest} style={[rest.style, styles.hidden]}>
          {children}
        </Text>
      </View>
    </MaskedView>
  )
}

const styles = StyleSheet.create({
  gradient: { backgroundImage: gradients.brand },
  hidden: { opacity: 0 },
})
