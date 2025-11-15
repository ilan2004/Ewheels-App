/**
 * Professional Design System for EV Wheels App
 * Based on modern mobile app design trends and best practices
 */

import { Platform } from 'react-native';

// COLORS - Professional Service App Palette
// Brand-level tokens used across the app
export const BrandColors = {
  surface: '#f4f3ef',   // navbar / light surfaces
  shellDark: '#2c2d32', // bottom tab bar / dark chrome
  primary: '#ff795b',   // main accent / active icon
  title: '#387868',     // title / brand text
  ink: '#1e1d19',       // dark text/icons on light backgrounds
};

export const Colors = {
  // Primary Colors
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE', 
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main primary
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Secondary/Success Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  // Warning Colors
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Error/Danger Colors
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Danger Colors (alias for error)
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Info Colors
  info: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  
  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Special Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// TYPOGRAPHY
export const Typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium', 
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'Inter-Bold',
      android: 'Inter-Bold',
      default: 'System',
    }),
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xl2: 24, // Alias for 2xl
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
    '5xl': 48,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// SPACING - 8px Grid System
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

// BORDER RADIUS
export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// SHADOWS
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  base: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// COMPONENT STYLES
export const ComponentStyles = {
  // Card Styles
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.base,
  },
  
  // Button Styles
  button: {
    primary: {
      backgroundColor: Colors.primary[600],
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.base,
      ...Shadows.sm,
    },
    secondary: {
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.primary[600],
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.base,
    },
  },
  
  // Input Styles
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[900],
  },
  
  // Tab Bar Styles
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingHorizontal: 4,
  },
  
  // Header Styles
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    ...Shadows.sm,
  },
};

// STATUS COLORS
export const StatusColors = {
  reported: Colors.error[500],
  assigned: Colors.primary[500], 
  in_progress: Colors.warning[500],
  completed: Colors.success[500],
  overdue: Colors.error[600],
  due_today: Colors.warning[600],
};

// PRIORITY COLORS  
export const PriorityColors = {
  1: Colors.error[500], // High
  2: Colors.warning[500], // Medium
  3: Colors.neutral[500], // Low
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles,
  StatusColors,
  PriorityColors,
};
