import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import type { AppNavigation } from '../../@types/navigation';

import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointments';
import { financeService } from '../../services/finance';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/shared/EmptyState';
import { StatCard } from '../../components/finance/StatCard';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  startTime: string;
  status: string;
  client: { name: string; phone: string };
  professional: { name: string };
  totalPrice: number;
}

export function Home() {
  const navigation = useNavigation<AppNavigation>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const dateStr = format(today, 'yyyy-MM-dd');

      const appointmentsRes = await appointmentService.list({
        date: dateStr,
        status: ['PENDING', 'CONFIRMED'],
      });

      let financeData = null;
      if (user?.role === 'OWNER') {
        try {
          financeData = await financeService.getDashboard({ period: 'month' });
        } catch {
          console.log('Finance data not available yet');
        }
      }

      setDashboardData(financeData);
      setTodayAppointments(appointmentsRes ?? []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'COMPLETED':
        return 'Concluído';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  if (loading && !refreshing) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={commonStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Card style={{ margin: 16, marginBottom: 0 }}>
        <View style={[commonStyles.rowBetween, commonStyles.mb4]}>
          <View>
            <Text style={commonStyles.h3}>
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </Text>
            <Text style={[commonStyles.bodySmall, { color: colors.textSecondary }]}>
              {user?.role === 'OWNER' ? 'Proprietário' : 'Profissional'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileSettings')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primaryLight,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 18 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[commonStyles.caption, { color: colors.textMuted }]}>
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </Text>
      </Card>

      {/* Owner Stats */}
      {user?.role === 'OWNER' && dashboardData && (
        <View style={{ padding: 16 }}>
          <Text style={[commonStyles.h3, commonStyles.mb4]}>Resumo do Mês</Text>

          <View style={{ gap: 12 }}>
            <StatCard
              title="Faturamento"
              value={formatCurrency(dashboardData.revenue || 0)}
              icon="attach-money"
              color={colors.primary}
            />

            <StatCard
              title="Atendimentos"
              value={dashboardData.appointments?.toString() || '0'}
              icon="event"
              color={colors.success}
            />

            <StatCard
              title="Ticket Médio"
              value={formatCurrency(dashboardData.averageTicket || 0)}
              icon="receipt"
              color={colors.warning}
            />
          </View>
        </View>
      )}

      {/* Agenda */}
      <View style={{ padding: 16 }}>
        <View style={[commonStyles.rowBetween, commonStyles.mb4]}>
          <Text style={commonStyles.h3}>Agenda de Hoje</Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('BottomTabs', { screen: 'Schedule' })
            }
          >
            <Text style={{ color: colors.primary }}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {todayAppointments.length > 0 ? (
          <View style={{ gap: 12 }}>
            {todayAppointments.slice(0, 5).map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() =>
                  navigation.navigate('AppointmentDetails', {
                    appointmentId: appointment.id,
                  })
                }
              >
                <View style={[commonStyles.rowBetween, commonStyles.mb2]}>
                  <Text style={[commonStyles.body, { fontWeight: '600' }]}>
                    {appointment.client.name}
                  </Text>

                  <Badge
                    text={getStatusText(appointment.status)}
                    variant={
                      appointment.status === 'PENDING'
                        ? 'warning'
                        : appointment.status === 'CONFIRMED'
                        ? 'success'
                        : appointment.status === 'COMPLETED'
                        ? 'info'
                        : 'error'
                    }
                  />
                </View>

                <Text style={[commonStyles.bodySmall, { color: colors.textSecondary }]}>
                  {format(parseISO(appointment.startTime), 'HH:mm')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="event-busy"
            title="Nenhum agendamento para hoje"
            description="Os agendamentos de hoje aparecerão aqui"
            actionText="Criar Agendamento"
            onAction={() => navigation.navigate('CreateAppointment')}
          />
        )}
      </View>
    </ScrollView>
  );
}
