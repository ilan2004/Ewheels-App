// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'person.fill': 'person',
  'envelope.fill': 'email',
  'briefcase.fill': 'work',
  'calendar.badge.plus': 'calendar-today',
  'location.fill': 'location-on',
  'lock.fill': 'lock',
  'bell.badge.fill': 'notifications',
  'bell.fill': 'notifications',
  'arrow.right.square.fill': 'logout',
  'doc.text.magnifyingglass': 'search',
  'gearshape.fill': 'settings',
  'clock.fill': 'schedule',
  'checkmark.circle.fill': 'check-circle',
  'person.3.fill': 'people',
  'gear': 'settings',
  'chart.bar.fill': 'bar-chart',
  'server.rack': 'dns',
  'person': 'person',
  'envelope': 'email',
  'briefcase': 'work',
  'number': 'confirmation-number',
  'checkmark.shield.fill': 'verified-user',
  'globe': 'public',
  'list.bullet': 'list',
  'shield.checkered': 'security',
  'crown.fill': 'stars',
  'bell': 'notifications-none',
  'moon': 'dark-mode',
  'questionmark.circle': 'help',
  'info.circle': 'info',
  'arrow.right.square': 'logout',
  'camera.fill': 'camera-alt',
  'pencil.circle.fill': 'edit',
  'xmark.circle.fill': 'close',
  'arrow.clockwise.circle.fill': 'sync',
  'moon.fill': 'dark-mode',
  'key.fill': 'vpn-key',
  'shield.fill': 'security',
  'doc.text.fill': 'description',
  'trash.fill': 'delete',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
