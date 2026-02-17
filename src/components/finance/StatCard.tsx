import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

/* =======================
   ICON TYPE
======================= */

type MaterialIconName = React.ComponentProps<
  typeof MaterialIcons
>['name'];

/* =======================
   PROPS
======================= */

interface StatCardProps {
  title: string;
  value: string;
  icon: MaterialIconName; // ✅ NÃO é string
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

/* =======================
   COMPONENT
======================= */

export function StatCard({
  title,
  value,
  icon,
  color = colors.primary,
  trend,
}: StatCardProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${color}20` },
        ]}
      >
        <MaterialIcons name={icon} size={24} color={color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>

        {trend && (
          <View style={styles.trendContainer}>
            <MaterialIcons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={16}
              color={
                trend.isPositive ? colors.success : colors.error
              }
            />
            <Text
              style={[
                styles.trendText,
                {
                  color: trend.isPositive
                    ? colors.success
                    : colors.error,
                },
              ]}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
