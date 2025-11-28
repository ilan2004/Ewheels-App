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
  'camera.viewfinder': 'camera-alt',
  'dollarsign.circle.fill': 'monetization-on',
  'person.crop.circle.fill': 'account-circle',
  'doc.text': 'article',
  'doc.text.fill.viewfinder': 'find-in-page',
  'car.fill': 'directions-car',
  'battery.100': 'battery-full',
  'exclamationmark.triangle': 'warning',
  'gearshape.2': 'build',
  'clock': 'access-time',
  'clock.badge.exclamationmark': 'history',
  'location': 'location-on',
  'xmark': 'close',
  'magnifyingglass': 'search',
  'line.3.horizontal.decrease': 'filter-list',
  'tray': 'inbox',

  'calendar': 'calendar-today',
  'dollarsign.circle': 'attach-money',
  'pencil.circle': 'edit',
  'car': 'directions-car',

  // Navigation & Actions
  'chevron.left': 'chevron-left',
  'square.and.arrow.up': 'share',
  'square.and.arrow.up.fill': 'share',
  'paperclip': 'attach-file',
  'folder.badge.plus': 'create-new-folder',
  'arrow.clockwise': 'refresh',
  'plus': 'add',

  'textformat': 'text-fields',

  // Media & Camera
  'camera.rotate.fill': 'flip-camera-ios',
  'photo.on.rectangle': 'image',
  'photo.fill': 'photo',
  'video.fill': 'videocam',
  'play.circle.fill': 'play-circle-filled',
  'square.grid.3x3.fill': 'grid-view',

  // Audio
  'waveform': 'graphic-eq',
  'mic.fill': 'mic',
  'mic.circle.fill': 'mic',
  'stop.fill': 'stop',
  'gobackward.10': 'replay-10',
  'goforward.10': 'forward-10',
  'pause.fill': 'pause',
  'play.fill': 'play-arrow',
  'speaker.wave.2.fill': 'volume-up',
  'speaker.fill': 'volume-mute',
  'speaker.3.fill': 'volume-up',

  // Misc
  'person.circle': 'account-circle',
  'stethoscope': 'medical-services',
  'flag.fill': 'flag',
  'info.circle.fill': 'info',
  // Job Card Details
  'phone.fill': 'phone',
  'shippingbox': 'inventory',
  'building.2': 'business',
  'car.2': 'directions-car',
  'barcode': 'qr-code',
  'wrench.and.screwdriver': 'build',
  'calendar.badge.clock': 'event-busy',
  'battery.50': 'battery-std',
  'bolt.circle': 'electric-bolt',
  'bolt.fill': 'flash-on',
  'circle.grid.3x3': 'grid-on',
  'person.badge.clock': 'perm-contact-calendar',
  'person.badge.plus': 'person-add',
  'arrow.forward.circle': 'arrow-forward',
  'arrow.forward': 'arrow-forward',
  'eye.fill': 'visibility',
  'arrow.triangle.2.circlepath': 'loop',
  'person.crop.circle': 'account-circle',
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
