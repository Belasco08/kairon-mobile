import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
}

export function Badge({ text, variant = 'primary', size = 'medium' }: BadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'info': return colors.info;
      default: return colors.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 6, paddingVertical: 2 };
      default:
        return { paddingHorizontal: 8, paddingVertical: 4 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 10;
      default: return 12;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          ...getSizeStyles(),
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            fontSize: getTextSize(),
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});