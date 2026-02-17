import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

/* =======================
   TYPES
======================= */

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  appointments?: Array<{
    date: Date;
    count: number;
  }>;
}

/* =======================
   COMPONENT
======================= */

export function Calendar({
  selectedDate,
  onDateSelect,
  appointments = [],
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const days: Array<Date | null> = [];

  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i
      )
    );
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getAppointmentCount = (date: Date) => {
    const found = appointments.find(
      app =>
        app.date.getDate() === date.getDate() &&
        app.date.getMonth() === date.getMonth() &&
        app.date.getFullYear() === date.getFullYear()
    );
    return found?.count ?? 0;
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  };

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth}>
          <Icon
            name="chevron-left"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {monthNames[currentMonth.getMonth()]}{' '}
          {currentMonth.getFullYear()}
        </Text>

        <TouchableOpacity onPress={nextMonth}>
          <Icon
            name="chevron-right"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={styles.dayNames}>
        {dayNames.map(day => (
          <Text key={day} style={styles.dayName}>
            {day}
          </Text>
        ))}
      </View>

      {/* Days grid */}
      <ScrollView>
        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            if (!date) {
              return (
                <View
                  key={`empty-${index}`}
                  style={styles.emptyDay}
                />
              );
            }

            const appointmentCount = getAppointmentCount(date);
            const today = isToday(date);
            const selected = isSelected(date);

            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.day,
                  today && styles.today,
                  selected && styles.selected,
                ]}
                onPress={() => onDateSelect(date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    today && styles.todayText,
                    selected && styles.selectedText,
                  ]}
                >
                  {date.getDate()}
                </Text>

                {appointmentCount > 0 && (
                  <View
                    style={[
                      styles.appointmentDot,
                      {
                        backgroundColor: selected
                          ? colors.textLight
                          : colors.primary,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dayNames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  today: {
    backgroundColor: colors.primaryLight,
  },
  todayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  selected: {
    backgroundColor: colors.primary,
  },
  selectedText: {
    color: colors.textLight,
    fontWeight: '600',
  },
  appointmentDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
