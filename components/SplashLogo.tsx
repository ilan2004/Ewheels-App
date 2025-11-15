import React from 'react';
import { ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface SplashLogoProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export function SplashLogo({ width = 300, height = 125, style }: SplashLogoProps) {
  return (
    <Image
      source={require('../ewheels logo splash.png')}
      style={[
        {
          width,
          height,
        },
        style,
      ]}
      contentFit="contain"
      cachePolicy="memory-disk"
      allowDownscaling={false}
      recyclingKey="splash-logo"
    />
  );
}
