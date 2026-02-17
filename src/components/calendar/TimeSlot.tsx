import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

interface TimeSlotProps {
  time: string;
  selected?: boolean;
  available?: boolean;
  onPress?: () => void;
}

export function TimeSlot({ time, selected = false, available = true, onPress }: TimeSlotProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.selected,
        !available && styles.unavailable,
      ]}
      onPress={onPress}
      disabled={!available}
    >
      <Text
        style={[
          styles.timeText,
          selected && styles.selectedText,
          !available && styles.unavailableText,
        ]}
      >
        {time}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    minWidth: 80,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unavailable: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  selectedText: {
    color: colors.textLight,
  },
  unavailableText: {
    color: colors.textMuted,
  },
});