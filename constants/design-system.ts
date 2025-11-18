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
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.base,
  },
  
  // Button Styles
  button: {
    primary: {
      backgroundColor: BrandColors.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.base,
      ...Shadows.sm,
    },
    secondary: {
      backgroundColor: BrandColors.surface,
      borderWidth: 1,
      borderColor: BrandColors.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.base,
    },
  },
  
  // Input Styles
  input: {
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.ink + '30', // 30% opacity
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: BrandColors.ink,
  },
  
  // Tab Bar Styles
  tabBar: {
    backgroundColor: BrandColors.shellDark,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingHorizontal: 4,
  },
  
  // Header Styles
  header: {
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 0,
    ...Shadows.sm,
  },
};

// STATUS COLORS
export const StatusColors = {
  reported: {
    primary: BrandColors.primary,
    background: BrandColors.primary + '15',
    text: BrandColors.primary,
  },
  triaged: {
    primary: BrandColors.title,
    background: BrandColors.title + '15',
    text: BrandColors.title,
  },
  in_progress: {
    primary: '#499588', // From AssignmentOverviewColors
    background: '#499588' + '15',
    text: '#499588',
  },
  completed: {
    primary: BrandColors.title,
    background: BrandColors.title + '15', 
    text: BrandColors.title,
  },
  overdue: {
    primary: Colors.error[600],
    background: Colors.error[100],
    text: Colors.error[600],
  },
  due_today: {
    primary: Colors.warning[600],
    background: Colors.warning[100],
    text: Colors.warning[600],
  },
};

// PRIORITY COLORS  
export const PriorityColors = {
  1: Colors.error[500], // High
  2: Colors.warning[500], // Medium
  3: Colors.neutral[500], // Low
};

// FLOOR MANAGER ASSIGNMENT OVERVIEW COLORS
// Gradients and text colors for the floor manager home "Assignment Overview" cards
export const AssignmentOverviewColors = {
  unassigned: {
    text: '#101113',
    gradient: ['#ffffff', '#fbdfdc'],
  },
  in_progress: {
    text: BrandColors.surface, // #f4f3ef
    gradient: ['#499588', '#387868'],
  },
  due_today: {
    text: BrandColors.surface, // #f4f3ef
    gradient: [BrandColors.primary, '#eea8a0'], // #ff795b -> #eea8a0
  },
  overdue: {
    text: Colors.error[600], // #DC2626
    gradient: ['#faf3e9', '#f9e9d2'],
  },
} as const;

// ADMIN PANEL OVERVIEW COLORS
// Using the same design as floor manager assignment overview cards for consistency
export const AdminPanelOverviewColors = {
  // Reuse assignment overview colors for admin panel cards
  unassigned: {
    text: AssignmentOverviewColors.unassigned.text, // #101113
    gradient: AssignmentOverviewColors.unassigned.gradient, // ['#ffffff', '#fbdfdc']
  },
  in_progress: {
    text: AssignmentOverviewColors.in_progress.text, // #f4f3ef
    gradient: AssignmentOverviewColors.in_progress.gradient, // ['#499588', '#387868']
  },
  due_today: {
    text: AssignmentOverviewColors.due_today.text, // #f4f3ef
    gradient: AssignmentOverviewColors.due_today.gradient, // ['#ff795b', '#eea8a0']
  },
  overdue: {
    text: AssignmentOverviewColors.overdue.text, // #DC2626
    gradient: AssignmentOverviewColors.overdue.gradient, // ['#faf3e9', '#f9e9d2']
  },
  // Additional admin-specific card types using similar styling
  users: {
    text: BrandColors.surface, // #f4f3ef
    gradient: [Colors.info[500], Colors.info[600]], // Blue gradient for user management
  },
  locations: {
    text: BrandColors.surface, // #f4f3ef
    gradient: [Colors.success[500], Colors.success[600]], // Green gradient for locations
  },
  financials: {
    text: BrandColors.surface, // #f4f3ef
    gradient: [BrandColors.primary, '#e86b4f'], // Brand gradient for financial overview
  },
  system: {
    text: AssignmentOverviewColors.unassigned.text, // #101113
    gradient: [Colors.neutral[100], Colors.neutral[200]], // Light gradient for system stats
  },
} as const;

// FINANCIAL COLORS
// Colors for financial management interface
export const FinancialColors = {
  income: {
    primary: Colors.success[600], // #059669
    background: Colors.success[50], // #ECFDF5
    text: Colors.success[700], // #047857
    gradient: ['#10B981', '#059669'],
  },
  expense: {
    primary: Colors.error[500], // #EF4444
    background: Colors.error[50], // #FEF2F2
    text: Colors.error[700], // #B91C1C
    gradient: ['#F87171', '#EF4444'],
  },
  profit: {
    primary: BrandColors.primary, // #ff795b
    background: BrandColors.primary + '15', // 15% opacity
    text: BrandColors.primary,
    gradient: [BrandColors.primary, '#e86b4f'],
  },
  pending: {
    primary: Colors.warning[500], // #F59E0B
    background: Colors.warning[50], // #FFFBEB
    text: Colors.warning[700], // #B45309
  },
  completed: {
    primary: Colors.success[500], // #10B981
    background: Colors.success[50], // #ECFDF5
    text: Colors.success[700], // #047857
  },
  cancelled: {
    primary: Colors.neutral[500], // #6B7280
    background: Colors.neutral[50], // #F9FAFB
    text: Colors.neutral[700], // #374151
  },
  chart: {
    sales: '#10B981',
    expenses: '#EF4444', 
    profit: BrandColors.primary,
    categories: [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
    ]
  }
} as const;

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles,
  StatusColors,
  PriorityColors,
  AssignmentOverviewColors,
  AdminPanelOverviewColors,
  FinancialColors,
};
