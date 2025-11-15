import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { BorderRadius, Shadows, Colors } from '@/constants/design-system';

interface ImageCardProps {
  source: any; // Image source (require() or URI)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  shadow?: boolean;
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: { width: 48, height: 48 },
  md: { width: 80, height: 80 },
  lg: { width: 120, height: 120 },
  xl: { width: 200, height: 160 },
};

const radiusMap = {
  sm: BorderRadius.sm,
  md: BorderRadius.md,
  lg: BorderRadius.lg,
  xl: BorderRadius.xl,
};

export const ImageCard: React.FC<ImageCardProps> = ({
  source,
  size = 'md',
  style,
  imageStyle,
  shadow = true,
  borderRadius = 'md',
}) => {
  const dimensions = sizeMap[size];
  const radius = radiusMap[borderRadius];

  return (
    <View
      style={[
        styles.container,
        dimensions,
        { borderRadius: radius },
        shadow && Shadows.base,
        style,
      ]}
    >
      <Image
        source={source}
        style={[
          styles.image,
          dimensions,
          { borderRadius: radius },
          imageStyle,
        ]}
        resizeMode="cover"
      />
    </View>
  );
};

// For empty states with larger images
export const HeroImageCard: React.FC<ImageCardProps> = ({
  source,
  style,
  imageStyle,
  shadow = false,
  borderRadius = 'lg',
}) => {
  const radius = radiusMap[borderRadius];

  return (
    <View
      style={[
        styles.heroContainer,
        { borderRadius: radius },
        shadow && Shadows.sm,
        style,
      ]}
    >
      <Image
        source={source}
        style={[
          styles.heroImage,
          { borderRadius: radius },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heroContainer: {
    backgroundColor: Colors.neutral[50],
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    width: 200,
    height: 160,
  },
});

export default ImageCard;
