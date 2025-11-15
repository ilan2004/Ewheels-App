import React from 'react';
import { ViewStyle } from 'react-native';
import { NavbarLogo } from './NavbarLogo';

interface LogoProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export function Logo({ width = 120, height = 40, style }: LogoProps) {
  return (
    <NavbarLogo
      width={width}
      height={height}
      style={style}
    />
  );
}
