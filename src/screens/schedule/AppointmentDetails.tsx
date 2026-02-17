import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { appointmentService } from "../../services/appointments";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM
// ==============================================================================
const theme = {
  primary: "#0F172A",
  cardBg: "#1E293B",
  gold: "#D4AF37",
  goldLight: "#FDE68A",
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  border: "rgba(255, 255, 255, 0.05)",
};

// --- TIPAGEM ---

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type RootStackParamList = {
  AppointmentDetails: { appointmentId: string };
  EditAppointment: { appointmentId: string };
};

type AppointmentDetailsRouteProp = RouteProp<
  RootStackParamList,
  "AppointmentDetails"
>;
type AppointmentDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AppointmentDetails"
>;

interface AppointmentServiceItem {
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  price: number;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  totalPrice: number;
  actualPrice?: number;
  actualDuration?: number;
  notes?: string;

  client?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  clientName?: string;
  clientPhone?: string;

  professional?: {
    id: string;
    name: string;
  };
  professionalName?: string;

  appointmentServices?: AppointmentServiceItem[];
  services?: any[];
}

export function AppointmentDetails() {
  const route = useRoute<AppointmentDetailsRouteProp>();
  const navigation = useNavigation<AppointmentDetailsNavigationProp>();
  const { appointmentId } = route.params;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointment();
  }, []);

  const loadAppointment = async () => {
    try {
      const response = await appointmentService.get(appointmentId);
      setAppointment(response as unknown as Appointment);
    } catch (error) {
      console.error("Erro ao carregar agendamento:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(appointmentId, newStatus);
      setAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
      Alert.alert("Sucesso", "Status atualizado!");
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o status");
    }
  };

  const getClientName = () =>
    appointment?.clientName || appointment?.client?.name || "Cliente";
  const getClientPhone = () =>
    appointment?.clientPhone || appointment?.client?.phone || "";
  const getProfessionalName = () =>
    appointment?.professionalName ||
    appointment?.professional?.name ||
    "Profissional";

  // Lógica de WhatsApp e Ligação
  const handleCallClient = () => {
    const phone = getClientPhone();
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleMessageClient = () => {
    const phone = getClientPhone();
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    Linking.openURL(`whatsapp://send?phone=${fullPhone}`);
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar Agendamento",
      "Tem certeza que deseja cancelar este agendamento?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: () => handleStatusChange("CANCELLED"),
        },
      ],
    );
  };

  const handleComplete = () => {
    Alert.alert(
      "Finalizar Atendimento",
      "Deseja marcar este atendimento como concluído?",
      [
        { text: "Ainda não", style: "cancel" },
        {
          text: "Sim, concluir",
          onPress: () => handleStatusChange("COMPLETED"),
        },
      ],
    );
  };

  const getStatusVariant = (
    status: AppointmentStatus,
  ): "info" | "success" | "warning" | "error" => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "CONFIRMED":
        return "success";
      case "COMPLETED":
        return "info";
      case "CANCELLED":
        return "error";
      case "NO_SHOW":
        return "error";
      default:
        return "info";
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
    const map: Record<string, string> = {
      PENDING: "Pendente",
      CONFIRMED: "Confirmado",
      COMPLETED: "Concluído",
      CANCELLED: "Cancelado",
      NO_SHOW: "Não Compareceu",
    };
    return map[status] || status;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Agendamento não encontrado</Text>
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  // --- SAFE PARSING ---
  let startTimeDate = new Date();
  try {
    startTimeDate = parseISO(appointment.startTime);
  } catch {}

  const formattedDate = isValid(startTimeDate)
    ? format(startTimeDate, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : appointment.startTime;

  const servicesList =
    appointment.appointmentServices || appointment.services || [];

  const calculatedDuration = servicesList.reduce((acc: number, item: any) => {
    const duration = item.service?.duration || item.duration || 0;
    return acc + duration;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 4 }}
        >
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Detalhes</Text>
          <View style={{ marginTop: 4 }}>
            <Badge
              text={getStatusText(appointment.status)}
              variant={getStatusVariant(appointment.status)}
            />
          </View>
        </View>

        {/* Botão Editar */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("EditAppointment", {
              appointmentId: appointment.id,
            })
          }
          disabled={["COMPLETED", "CANCELLED"].includes(appointment.status)}
          style={{
            opacity: ["COMPLETED", "CANCELLED"].includes(appointment.status)
              ? 0.3
              : 1,
            padding: 4,
          }}
        >
          <Feather name="edit" size={22} color={theme.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO PRINCIPAL (Data e Profissional) */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Feather name="calendar" size={20} color={theme.gold} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Data e Hora</Text>
              <Text style={[styles.infoValue, { textTransform: "capitalize" }]}>
                {formattedDate}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Feather name="scissors" size={20} color={theme.gold} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Profissional</Text>
              <Text style={styles.infoValue}>{getProfessionalName()}</Text>
            </View>
          </View>
        </View>

        {/* CLIENTE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.clientName}>{getClientName()}</Text>
            {getClientPhone() ? (
              <Text style={styles.clientPhone}>{getClientPhone()}</Text>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              title="Ligar"
              onPress={handleCallClient}
              variant="outline"
              style={{
                flex: 1,
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "transparent",
              }}
              textStyle={{ color: theme.textPrimary }}
              disabled={!getClientPhone()}
            />
            <TouchableOpacity
              style={[
                styles.whatsappButton,
                !getClientPhone() && { opacity: 0.5 },
              ]}
              onPress={handleMessageClient}
              disabled={!getClientPhone()}
            >
              <Text style={styles.whatsappButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SERVIÇOS */}
        <View style={styles.card}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={styles.cardTitle}>Serviços</Text>
            <Text style={styles.durationBadge}>{calculatedDuration} min</Text>
          </View>

          {servicesList.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum serviço listado.</Text>
          ) : (
            servicesList.map((item: any, index: number) => {
              const name = item.service?.name || item.name || "Serviço";
              const price = item.price || item.service?.price || 0;
              const duration = item.service?.duration || item.duration || 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.serviceRow,
                    index === servicesList.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View>
                    <Text style={styles.serviceName}>{name}</Text>
                    <Text style={styles.serviceDuration}>{duration} min</Text>
                  </View>
                  <Text style={styles.servicePrice}>
                    {formatCurrency(price)}
                  </Text>
                </View>
              );
            })
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(appointment.totalPrice)}
            </Text>
          </View>
        </View>

        {/* NOTAS */}
        {appointment.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Observações</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        )}

        {/* AÇÕES DE STATUS */}
        {appointment.status === "PENDING" ||
        appointment.status === "CONFIRMED" ? (
          <View style={{ gap: 12, marginTop: 10 }}>
            <Button
              title="Finalizar Atendimento"
              onPress={handleComplete}
              style={{ backgroundColor: theme.success }}
              textStyle={{ fontWeight: "800" }}
            />
            <Button
              title="Cancelar Agendamento"
              onPress={handleCancel}
              variant="outline"
              style={{
                borderColor: theme.danger,
                backgroundColor: "transparent",
              }}
              textStyle={{ color: theme.danger, fontWeight: "700" }}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.primary,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.textPrimary,
  },
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.textSecondary,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
  },
  clientName: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.textPrimary,
  },
  clientPhone: {
    fontSize: 14,
    color: theme.goldLight,
    marginTop: 4,
    fontWeight: "500",
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: "rgba(16, 185, 129, 0.15)", // Fundo verde transparente
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  whatsappButtonText: {
    color: theme.success,
    fontWeight: "700",
    fontSize: 15,
  },
  durationBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: "600",
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.textPrimary,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: "500",
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.gold,
  },
  totalRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.textPrimary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.gold,
  },
  notesText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
  },
});
