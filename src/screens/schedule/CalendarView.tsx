import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; // Trocado para Feather para manter o padrão premium
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointments';
import { Calendar } from '../../components/calendar/Calendar';
import { EmptyState } from '../../components/shared/EmptyState';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM
// ==============================================================================
const theme = {
  primary: '#0F172A',      
  cardBg: '#1E293B',       
  gold: '#D4AF37',         
  goldLight: '#FDE68A',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#38BDF8',
  border: 'rgba(255, 255, 255, 0.05)',
};

type RootStackParamList = {
  CalendarView: undefined;
  CreateAppointment: undefined;
  AppointmentDetails: { appointmentId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Expandimos a interface local para aceitar as duas formas que o backend pode enviar
interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    clientName?: string;
    client?: { name: string };
    professionalName?: string;
    professional?: { name: string };
}

export function CalendarView() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointmentsByDate, setAppointmentsByDate] = useState<Record<string, number>>({});
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadMonthAppointments();
  }, [selectedDate]);

  const loadMonthAppointments = async () => {
    try {
      setLoading(true);

      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      const response = await appointmentService.list({
        date: format(startDate, 'yyyy-MM-dd'), 
      });

      const counts: Record<string, number> = {};
      
      // Forçamos o cast para Appointment[] para o TS não reclamar
      const typedResponse = response as unknown as Appointment[];

      typedResponse.forEach(app => {
        const dateStr = format(parseISO(app.startTime), 'yyyy-MM-dd');
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      });

      setAppointmentsByDate(counts);
      setMonthAppointments(typedResponse);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const getAppointmentsForSelectedDate = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return monthAppointments.filter(
      appointment => format(parseISO(appointment.startTime), 'yyyy-MM-dd') === dateStr
    );
  };

  const appointmentsData = Object.entries(appointmentsByDate).map(([date, count]) => ({
    date: new Date(date + 'T12:00:00'), // Adicionado meio-dia para evitar bug de fuso horário no calendário
    count,
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  const selectedDateAppointments = getAppointmentsForSelectedDate();

  // Helper para cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return theme.warning;
      case 'CONFIRMED': return theme.info;
      case 'COMPLETED': return theme.success;
      case 'CANCELLED': return theme.danger;
      default: return theme.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'CONFIRMED': return 'Confirmado';
      case 'COMPLETED': return 'Concluído';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendário</Text>
        <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateAppointment')}
        >
          <Feather name="plus" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Calendar Component */}
        {/* OBS: O componente interno <Calendar /> pode precisar de ajustes no arquivo dele se estiver com fundo branco fixo */}
        <View style={styles.calendarWrapper}>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            appointments={appointmentsData}
          />
        </View>

        {/* Appointments for selected date */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            Agenda do dia {format(selectedDate, 'dd/MM/yyyy')}
          </Text>

          {selectedDateAppointments.length > 0 ? (
            <View style={{ gap: 12 }}>
              {selectedDateAppointments.map(app => {
                const statusColor = getStatusColor(app.status);
                
                // 👇 Leitura segura dos nomes (Client e Profissional)
                const clientName = app.clientName || app.client?.name || 'Cliente não informado';
                const profName = app.professionalName || app.professional?.name || 'Profissional';

                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.appointmentCard, { borderLeftColor: statusColor }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: app.id })}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.clientName}>{clientName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {getStatusText(app.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Feather name="clock" size={14} color={theme.textSecondary} />
                      <Text style={styles.infoText}>
                        {format(parseISO(app.startTime), 'HH:mm')} -{' '}
                        {format(parseISO(app.endTime), 'HH:mm')}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Feather name="user" size={14} color={theme.textSecondary} />
                      <Text style={styles.infoText}>{profName}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={{ marginTop: 20 }}>
                <EmptyState
                icon="calendar" // Usando Feather Icon válido
                title="Agenda Livre"
                description="Nenhum agendamento para esta data."
                actionText="Novo Agendamento"
                onAction={() => navigation.navigate('CreateAppointment')}
                />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.primary,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: theme.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.textPrimary
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.gold,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4
    },
    calendarWrapper: {
        padding: 16,
        backgroundColor: theme.primary, // Mantém o fundo da tela se o calendário for transparente
    },
    listSection: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.gold,
        marginBottom: 16,
    },
    appointmentCard: {
        backgroundColor: theme.cardBg,
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.textPrimary,
        flex: 1,
        marginRight: 10
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 13,
        color: theme.textSecondary,
        marginLeft: 8,
        fontWeight: '500'
    }
});