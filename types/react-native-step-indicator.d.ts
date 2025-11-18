declare module 'react-native-step-indicator' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  interface StepIndicatorStyles {
    stepIndicatorSize?: number;
    currentStepIndicatorSize?: number;
    separatorStrokeWidth?: number;
    stepStrokeCurrentColor?: string;
    stepStrokeWidth?: number;
    stepStrokeFinishedColor?: string;
    stepStrokeUnFinishedColor?: string;
    separatorFinishedColor?: string;
    separatorUnFinishedColor?: string;
    stepIndicatorFinishedColor?: string;
    stepIndicatorUnFinishedColor?: string;
    stepIndicatorCurrentColor?: string;
    stepIndicatorLabelFontSize?: number;
    currentStepIndicatorLabelFontSize?: number;
    stepIndicatorLabelCurrentColor?: string;
    stepIndicatorLabelFinishedColor?: string;
    stepIndicatorLabelUnFinishedColor?: string;
    labelColor?: string;
    labelSize?: number;
    currentStepLabelColor?: string;
    labelAlign?: 'center' | 'left' | 'right';
    labelStyle?: TextStyle;
    currentStepLabelStyle?: TextStyle;
  }

  interface StepIndicatorProps {
    currentPosition: number;
    stepCount: number;
    customStyles?: StepIndicatorStyles;
    direction?: 'vertical' | 'horizontal';
    labels?: string[];
    onPress?: (position: number) => void;
    renderStepIndicator?: (params: { position: number; stepStatus: string }) => React.ReactNode;
    renderLabel?: (params: { position: number; stepStatus: string; label: string; currentPosition: number }) => React.ReactNode;
    style?: ViewStyle;
  }

  export default class StepIndicator extends Component<StepIndicatorProps> {}
}
