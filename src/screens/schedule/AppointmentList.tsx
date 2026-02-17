import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { appointmentService } from "../../services/appointments";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  info: '#38BDF8', // Azul claro para destaque no dark mode
  border: 'rgba(255, 255, 255, 0.05)',
};

// =========================
// TYPES & CONFIG
// =========================

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type RootStackParamList = {
  AppointmentList: undefined;
  AppointmentDetails: { appointmentId: string };
  CreateAppointment: { initialDate?: string; initialTime?: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  totalPrice: number;
  clientName: string;
  clientPhone?: string;
  professionalName: string;
  services: Array<{
    name: string;
    price: number;
  }>;
}

const STATUS_COLORS = {
  PENDING: theme.warning,
  CONFIRMED: theme.info,
  COMPLETED: theme.success,
  CANCELLED: theme.danger,
  NO_SHOW: theme.textSecondary,
};

const STATUS_TRANSLATION = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Ausente",
};

// =========================
// COMPONENT
// =========================

export function AppointmentList() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const screenWidth = Dimensions.get("window").width;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- ESTADOS DE CONFIGURAÇÃO DE HORÁRIO ---
  const [showSettings, setShowSettings] = useState(false);
  const [workStart, setWorkStart] = useState("07"); 
  const [workEnd, setWorkEnd] = useState("20"); 
  const [lunchStart, setLunchStart] = useState("12"); 
  const [lunchEnd, setLunchEnd] = useState("13"); 

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 6 }).map((_, i) => addDays(start, i));
  }, [selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = { date: format(selectedDate, "yyyy-MM-dd") };

      const response = await appointmentService.list(params);
      const typedResponse = response as unknown as Appointment[];

      setAppointments(typedResponse || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar a agenda.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getStatusColor = (status: AppointmentStatus) =>
    STATUS_COLORS[status] || STATUS_COLORS.CONFIRMED;

  // --- RENDERIZADORES ---

  const renderWeekCalendar = () => (
    <View style={styles.calendarContainer}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthText}>
          {format(selectedDate, "MMMM, yyyy", { locale: ptBR })}
        </Text>
        <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
          <Text style={styles.todayLink}>Hoje</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <TouchableOpacity
              key={date.toString()}
              onPress={() => setSelectedDate(date)}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayTextSelected]}>
                {format(date, "EEE", { locale: ptBR }).replace(".", "")}
              </Text>
              <View
                style={[
                  styles.dayNumberContainer,
                  isSelected && styles.dayNumberSelectedBg,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberTextSelected,
                    !isSelected && isToday && styles.dayTextToday,
                  ]}
                >
                  {format(date, "d")}
                </Text>
              </View>
              {isToday && !isSelected && <View style={styles.dotIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderAppointmentCard = (appointment: Appointment) => {
    const statusColor = getStatusColor(appointment.status);
    const start = parseISO(appointment.startTime);
    const end = parseISO(appointment.endTime);

    return (
      <TouchableOpacity
        key={appointment.id}
        style={[styles.appointmentCard, { borderLeftColor: statusColor }]}
        onPress={() =>
          navigation.navigate("AppointmentDetails", {
            appointmentId: appointment.id,
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.cardTimeColumn}>
          <Text style={styles.cardTimeStart}>{format(start, "HH:mm")}</Text>
          <Text style={styles.cardTimeEnd}>{format(end, "HH:mm")}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.clientName} numberOfLines={1}>
            {appointment.clientName || "Cliente sem nome"}
          </Text>

          <Text style={styles.serviceList} numberOfLines={1}>
            {appointment.services && appointment.services.length > 0
              ? appointment.services.map((s) => s.name).join(", ")
              : "Serviço não listado"}
          </Text>

          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_TRANSLATION[appointment.status] || appointment.status}
              </Text>
            </View>
            <Text style={styles.priceText}>
              {formatCurrency(appointment.totalPrice)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimeLine = () => {
    const startHour = parseInt(workStart) || 7;
    const endHour = parseInt(workEnd) || 20;
    const lunchStartHour = parseInt(lunchStart) || 12;
    const lunchEndHour = parseInt(lunchEnd) || 13;

    const hours = Array.from(
      { length: endHour - startHour + 1 },
      (_, i) => i + startHour,
    );

    return (
      <View style={styles.timelineContainer}>
        {hours.map((hour) => {
          const appointmentsInHour = appointments.filter((app) => {
            const appDate = parseISO(app.startTime);
            return appDate.getHours() === hour;
          });

          const now = new Date();
          const isCurrentHour =
            isSameDay(selectedDate, now) && now.getHours() === hour;

          const isLunchTime = hour >= lunchStartHour && hour < lunchEndHour;

          return (
            <View key={hour} style={styles.timeSlot}>
              <View style={styles.timeLabelContainer}>
                <Text style={styles.timeLabel}>{`${hour}:00`}</Text>
              </View>

              <View style={[styles.slotContent, isLunchTime && styles.slotContentBlocked]}>
                {isCurrentHour && (
                  <View style={styles.currentTimeLine}>
                    <View style={styles.currentTimeDot} />
                  </View>
                )}

                {appointmentsInHour.length > 0 ? (
                  appointmentsInHour.map(renderAppointmentCard)
                ) : isLunchTime ? (
                  <View style={styles.lunchBlock}>
                    <Feather name="coffee" size={18} color={theme.textSecondary} />
                    <Text style={styles.lunchText}>Horário de Almoço</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emptySlotButton}
                    onPress={() =>
                      navigation.navigate("CreateAppointment", {
                        initialDate: format(selectedDate, "yyyy-MM-dd"),
                        initialTime: `${hour}:00`,
                      })
                    }
                  >
                    <Feather name="plus" size={16} color={theme.textSecondary} />
                    <Text style={styles.emptySlotText}>Disponível</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // --- MODAL DE CONFIGURAÇÃO ---
  const renderSettingsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSettings}
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configurar Horários</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Feather name="x" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Expediente (Início - Fim)</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Das</Text>
              <TextInput
                style={styles.input}
                value={workStart}
                onChangeText={setWorkStart}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={styles.inputSuffix}>:00</Text>
            </View>
            <Text style={{ alignSelf: "center", color: theme.textSecondary }}>-</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Até</Text>
              <TextInput
                style={styles.input}
                value={workEnd}
                onChangeText={setWorkEnd}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={styles.inputSuffix}>:00</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Horário de Almoço (Bloqueio)</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Das</Text>
              <TextInput
                style={styles.input}
                value={lunchStart}
                onChangeText={setLunchStart}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={styles.inputSuffix}>:00</Text>
            </View>
            <Text style={{ alignSelf: "center", color: theme.textSecondary }}>-</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Até</Text>
              <TextInput
                style={styles.input}
                value={lunchEnd}
                onChangeText={setLunchEnd}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={styles.inputSuffix}>:00</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.saveButtonText}>Salvar Configuração</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // --- RENDER PRINCIPAL ---

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerTop}>
          <Text style={styles.screenTitle}>Agenda</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowSettings(true)}>
              <Feather name="settings" size={20} color={theme.gold} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("CreateAppointment", {})}>
              <Feather name="plus" size={24} color={theme.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {renderWeekCalendar()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderTimeLine()}
          <View style={{ alignItems: "center", marginTop: 20, marginBottom: 20 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              Fim do expediente ({workEnd}:00)
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {renderSettingsModal()}
    </View>
  );
}

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.primary,
  },

  // Header
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 10 : 10,
    marginBottom: 16,
  },
  screenTitle: { fontSize: 28, fontWeight: "800", color: theme.textPrimary },
  iconButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)'
  },

  // Calendário
  calendarContainer: {
    backgroundColor: theme.cardBg,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  monthText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.textPrimary,
    textTransform: "capitalize",
  },
  todayLink: {
    fontSize: 13,
    color: theme.gold,
    fontWeight: "700",
  },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayButton: { alignItems: "center", paddingVertical: 4, flex: 1 },
  dayButtonSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: '600'
  },
  dayNumberContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dayNumberSelectedBg: { backgroundColor: theme.gold },
  dayNumber: { fontSize: 14, fontWeight: "700", color: theme.textPrimary },
  dayTextSelected: { color: theme.gold },
  dayNumberTextSelected: { color: theme.primary, fontWeight: '900' },
  dayTextToday: { color: theme.goldLight },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.gold,
    marginTop: 4,
  },

  // Timeline
  scrollView: { flex: 1, paddingHorizontal: 16 },
  timelineContainer: { paddingTop: 8 },
  timeSlot: { flexDirection: "row", minHeight: 80 },
  timeLabelContainer: { width: 50, alignItems: "flex-start", paddingTop: 0 },
  timeLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: "600",
    transform: [{ translateY: -6 }],
  },
  slotContent: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingBottom: 16,
    paddingLeft: 12,
  },
  slotContentBlocked: { backgroundColor: 'rgba(255,255,255,0.02)' }, 

  // Empty State & Lunch Block
  emptySlotButton: {
    flex: 1,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    height: 54,
  },
  emptySlotText: { fontSize: 13, color: theme.textSecondary, marginLeft: 8, fontWeight: '600' },
  lunchBlock: {
    flex: 1,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    height: 54,
    borderWidth: 1,
    borderColor: theme.border
  },
  lunchText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Appointment Card
  appointmentCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    marginBottom: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTimeColumn: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: theme.border,
    paddingRight: 12,
  },
  cardTimeStart: { fontSize: 15, fontWeight: "800", color: theme.textPrimary },
  cardTimeEnd: { fontSize: 12, color: theme.textSecondary, marginTop: 2, fontWeight: '500' },
  cardContent: { flex: 1, justifyContent: "center" },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.textPrimary,
    marginBottom: 4,
  },
  serviceList: { fontSize: 13, color: theme.textSecondary, marginBottom: 8, fontWeight: '500' },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  priceText: { fontSize: 14, fontWeight: "800", color: theme.gold },

  // Current Time Line
  currentTimeLine: {
    position: "absolute",
    top: -1,
    left: -6,
    right: 0,
    height: 2,
    backgroundColor: theme.danger,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  currentTimeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.danger,
    marginLeft: -5,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: theme.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: theme.textPrimary },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.goldLight,
    marginBottom: 12,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border
  },
  inputLabel: { fontSize: 12, color: theme.textSecondary, marginRight: 8, fontWeight: '600' },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: theme.textPrimary,
    textAlign: "center",
  },
  inputSuffix: { fontSize: 14, color: theme.textSecondary, fontWeight: '600' },
  saveButton: {
    backgroundColor: theme.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: { color: theme.primary, fontWeight: "900", fontSize: 16 },
});