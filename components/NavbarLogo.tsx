import { Image } from 'expo-image';
import React from 'react';
import { ViewStyle } from 'react-native';

interface NavbarLogoProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export function NavbarLogo({ width = 120, height = 50, style }: NavbarLogoProps) {
  return (
    <Image
      source={require('../ewheels logo navbar.png')}
      style={[
        {
          width,
          height,
        },
        style as any,
      ]}
      contentFit="contain"
      cachePolicy="memory-disk"
      allowDownscaling={false}
      recyclingKey="navbar-logo"
    />
  );
}
