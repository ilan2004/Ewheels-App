/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';
import { BrandColors } from './design-system';

// Use BrandColors for consistent theming
const tintColorLight = BrandColors.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: BrandColors.ink,
    background: BrandColors.surface,
    tint: tintColorLight,
    icon: BrandColors.ink,
    tabIconDefault: BrandColors.ink + '80', // 50% opacity
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: BrandColors.surface,
    background: BrandColors.shellDark,
    tint: tintColorDark,
    icon: BrandColors.surface,
    tabIconDefault: BrandColors.surface + '80', // 50% opacity
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
