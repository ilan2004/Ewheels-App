import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Spacing, StatusColors, Typography } from '@/constants/design-system';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StepIndicator from 'react-native-step-indicator';

interface HorizontalServiceProgressProps {
  currentStatus: string;
  completedSteps?: string[];
}

const statusSteps = [
  { key: 'reported', label: 'Reported', icon: 'exclamationmark.circle' },
  { key: 'triaged', label: 'Triaged', icon: 'magnifyingglass' },
  { key: 'in_progress', label: 'In Progress', icon: 'hammer' },
  { key: 'completed', label: 'Completed', icon: 'checkmark.circle.fill' },
];

export function HorizontalServiceProgress({
  currentStatus,
  completedSteps = []
}: HorizontalServiceProgressProps) {

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const getStepColors = () => {
    return {
      stepIndicatorSize: 40,
      currentStepIndicatorSize: 45,
      separatorStrokeWidth: 3,
      currentStepStrokeWidth: 4,
      stepStrokeCurrentColor: BrandColors.primary,
      stepStrokeWidth: 3,
      stepStrokeFinishedColor: BrandColors.title,
      stepStrokeUnFinishedColor: BrandColors.ink + '30',
      separatorFinishedColor: BrandColors.title,
      separatorUnFinishedColor: BrandColors.ink + '30',
      stepIndicatorFinishedColor: BrandColors.title,
      stepIndicatorUnFinishedColor: BrandColors.surface,
      stepIndicatorCurrentColor: BrandColors.primary,
      stepIndicatorLabelFontSize: 0, // Hide default labels
      currentStepIndicatorLabelFontSize: 0,
      stepIndicatorLabelCurrentColor: 'transparent',
      stepIndicatorLabelFinishedColor: 'transparent',
      stepIndicatorLabelUnFinishedColor: 'transparent',
      labelColor: BrandColors.ink + '60',
      labelSize: Typography.fontSize.sm,
      currentStepLabelColor: BrandColors.primary,
    };
  };

  const renderStepIndicator = ({ position, stepStatus }: { position: number, stepStatus: string }) => {
    const step = statusSteps[position];
    if (!step) return null;

    let iconColor = BrandColors.ink + '60';
    if (stepStatus === 'finished') {
      iconColor = BrandColors.surface;
    } else if (stepStatus === 'current') {
      iconColor = BrandColors.surface;
    }

    return (
      <View style={styles.stepIconContainer}>
        <IconSymbol
          name={step.icon as any}
          size={18}
          color={iconColor}
        />
      </View>
    );
  };

  const renderLabel = ({ position, stepStatus }: { position: number, stepStatus: string }) => {
    const step = statusSteps[position];
    if (!step) return null;

    let labelStyle: any = styles.stepLabel;
    if (stepStatus === 'finished') {
      labelStyle = [styles.stepLabel, styles.finishedStepLabel];
    } else if (stepStatus === 'current') {
      labelStyle = [styles.stepLabel, styles.currentStepLabel];
    }

    return (
      <Text style={labelStyle}>
        {step.label}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={BrandColors.title} />
        <Text style={styles.title}>Service Progress</Text>
      </View>

      <View style={styles.progressContainer}>
        <StepIndicator
          customStyles={getStepColors()}
          currentPosition={getCurrentStepIndex()}
          labels={statusSteps.map(step => step.label)}
          stepCount={statusSteps.length}
          direction="horizontal"
          renderStepIndicator={renderStepIndicator}
          renderLabel={renderLabel}
        />
      </View>

      {/* Current Status Info */}
      <View style={styles.statusInfo}>
        <View style={[styles.statusBadge, { backgroundColor: StatusColors[currentStatus as keyof typeof StatusColors]?.background || BrandColors.primary + '20' }]}>
          <IconSymbol
            name={(statusSteps.find(s => s.key === currentStatus)?.icon || 'circle') as any}
            size={14}
            color={StatusColors[currentStatus as keyof typeof StatusColors]?.primary || BrandColors.ink}
          />
          <Text style={[styles.statusText, { color: StatusColors[currentStatus as keyof typeof StatusColors]?.primary || BrandColors.primary }]}>
            Current: {currentStatus.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BrandColors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
  },
  progressContainer: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  stepIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
    textAlign: 'center',
    marginTop: Spacing.sm,
    textTransform: 'capitalize',
  },
  finishedStepLabel: {
    color: BrandColors.title,
    fontFamily: Typography.fontFamily.semibold,
  },
  currentStepLabel: {
    color: BrandColors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  statusInfo: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
});
