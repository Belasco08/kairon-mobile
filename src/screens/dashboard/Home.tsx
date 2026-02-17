import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  Linking,
  Alert,
  StyleSheet,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { MaterialIcons as Icon, Feather } from "@expo/vector-icons";
import { useWebSocket } from "../../contexts/WebSocketContext";

import type { AppNavigation } from "../../@types/navigation";

import { useAuth } from "../../contexts/AuthContext";
import { appointmentService } from "../../services/appointments";
import { financeService } from "../../services/finance";
import { api } from "../../services/api";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/shared/EmptyState";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM
// ==============================================================================
const theme = {
  primary: '#0F172A',      // Azul Marinho Fundo
  cardBg: '#1E293B',       // Azul Marinho Cartões
  gold: '#D4AF37',         // Dourado Principal
  goldLight: '#FDE68A',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  success: '#10B981',
  border: 'rgba(255, 255, 255, 0.05)',
};

// ==============================================================================
// ⚠️ CONSTANTES E CONFIGURAÇÕES
// ==============================================================================
const API_URL = "https://kairon-api.onrender.com";

// --- GAMIFICATION: NÍVEIS DE VENDAS ---
const SALES_GOALS = [
  { limit: 10000, label: "Bronze", color: "#CD7F32", nextLabel: "Prata" },
  { limit: 50000, label: "Prata", color: "#94A3B8", nextLabel: "Ouro" },
  { limit: 100000, label: "Ouro", color: "#D4AF37", nextLabel: "Diamante" },
  { limit: 1000000, label: "Diamante", color: "#38BDF8", nextLabel: "Lenda" }, 
];

interface Appointment {
  id: string;
  startTime: string;
  status: string;
  clientName: string;
  clientPhone?: string;
  professionalName: string;
  totalPrice: number;
}

// ==============================================================================
// 🛠️ HELPER FUNCTIONS
// ==============================================================================

const buildWhatsAppMessage = (
  appointment: Appointment,
  company: any,
  userName: string | undefined
) => {
  const defaultTemplate = `Olá *{CLIENTE}*! 👋
Seu agendamento foi confirmado!

🗓 Data: {DATA}
⏰ Horário: {HORA}
✂️ Profissional: {PROFISSIONAL}
💰 Valor: {VALOR}

📍 Endereço: {ENDERECO}

Te aguardamos na *{EMPRESA}*! 👊`;

  let msg = company?.whatsappTemplate || defaultTemplate;

  const dateObj = parseISO(appointment.startTime);
  const dataFmt = format(dateObj, "dd/MM/yyyy");
  const horaFmt = format(dateObj, "HH:mm");
  const valorFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(appointment.totalPrice);

  msg = msg.replace(/{CLIENTE}/g, appointment.clientName || "Cliente");
  msg = msg.replace(
    /{PROFISSIONAL}/g,
    appointment.professionalName || userName || "Profissional"
  );
  msg = msg.replace(/{DATA}/g, dataFmt);
  msg = msg.replace(/{HORA}/g, horaFmt);
  msg = msg.replace(/{VALOR}/g, valorFmt);
  msg = msg.replace(/{ENDERECO}/g, company?.address || "Endereço não informado");
  msg = msg.replace(/{EMPRESA}/g, company?.name || "Barbearia");

  return msg;
};

const getAvatarSource = (user: any) => {
  if (!user?.avatar) return null;
  const avatarPath = user.avatar;
  if (avatarPath.startsWith("http")) return { uri: avatarPath };

  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  let cleanPath = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
  if (baseUrl.endsWith("/api") && cleanPath.startsWith("/api")) {
    cleanPath = cleanPath.replace("/api", "");
  }
  return { uri: `${baseUrl}${cleanPath}?t=${new Date().getTime()}` };
};

// ==============================================================================
// 📱 COMPONENTE PRINCIPAL
// ==============================================================================

export function Home() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { lastUpdate } = useWebSocket();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [localCompany, setLocalCompany] = useState<any>(null);

  const fetchCompanyData = async () => {
    const targetId = user?.companyId; 
    if (!targetId) return;
    try {
      const response = await api.get(`/companies/${targetId}`);
      setLocalCompany(response.data);
    } catch (error) {
      console.error("Erro ao atualizar empresa na Home:", error);
    }
  };

  const loadData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const today = new Date();
      const dateStr = format(today, "yyyy-MM-dd");

      const appointmentsRes = await appointmentService.list({ date: dateStr });
      const rawList = (appointmentsRes as unknown as Appointment[]) || [];
      const filteredList = rawList
        .filter((app) => app.status === "PENDING" || app.status === "CONFIRMED")
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      setTodayAppointments(filteredList);

      let financeData = null;
      if (user?.role === "OWNER" || user?.role === "PROFESSIONAL") {
        try {
          financeData = await financeService.getDashboard({ period: "month" });
        } catch (error: any) { }
      }
      setDashboardData(financeData);
    } catch (error) {
      console.error("❌ [HOME] Erro ao carregar:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCompanyData();
      loadData();
    }, [])
  );

  const handleConfirmAppointment = async (appointment: Appointment) => {
    try {
      setLoading(true);
      await appointmentService.updateStatus(appointment.id, "CONFIRMED");
      if (appointment.clientPhone) {
        const phone = appointment.clientPhone.replace(/\D/g, "");
        const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
        const message = buildWhatsAppMessage(appointment, localCompany, user?.name);
        const url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Sucesso", "Confirmado, mas WhatsApp não instalado.");
        }
      } else {
        Alert.alert("Sucesso", "Confirmado (Cliente sem telefone).");
      }
      loadData();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível confirmar o agendamento.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lastUpdate) {
      if (lastUpdate.type === "APPOINTMENT_NEW" || lastUpdate.type === "APPOINTMENT_UPDATE") {
        loadData();
      }
    }
  }, [lastUpdate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanyData();
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "Pendente";
      case "CONFIRMED": return "Confirmado";
      case "COMPLETED": return "Concluído";
      case "CANCELLED": return "Cancelado";
      default: return status;
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // --- COMPONENTE INTERNO: BARRA DE META ---
  const GoalProgressBar = () => {
    if (!dashboardData) return null;
    const currentRevenue = dashboardData.revenue || 0;
    const currentGoal = SALES_GOALS.find(g => g.limit > currentRevenue) || SALES_GOALS[SALES_GOALS.length - 1];
    const progress = Math.min((currentRevenue / currentGoal.limit) * 100, 100);
    const displayProgress = currentRevenue >= 1000000 ? 100 : progress;

    return (
      // 👇 AGORA O CARD É CLICÁVEL E LEVA PARA A TELA DE EXPLICAÇÃO DAS METAS
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => navigation.navigate("GoalsInfoScreen")} 
        style={styles.goalCard}
      >

    
        <View style={styles.goalHeaderRow}>
          <View>
            <Text style={styles.goalLabel}>
              Faturamento do Mês
            </Text>
            <Text style={styles.goalRevenue}>
              {formatCurrency(currentRevenue)}
            </Text>
          </View>
          <View style={[styles.goalBadge, { backgroundColor: currentGoal.color + '20' }]}>
             <Icon name="emoji-events" size={18} color={currentGoal.color} />
             <Text style={[styles.goalBadgeText, { color: currentGoal.color }]}>
               {currentGoal.label}
             </Text>
          </View>
        </View>

        {/* Barra de Progresso */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${displayProgress}%`, backgroundColor: currentGoal.color }]} />
        </View>
        
        <View style={styles.goalFooterRow}>
          <Text style={styles.goalFooterText}>
            {progress.toFixed(0)}% da meta
          </Text>
          <Text style={styles.goalFooterTarget}>
            Próximo: {formatCurrency(currentGoal.limit)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // --- RENDER ---
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  const avatarSource = getAvatarSource(user);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER LIMPO */}
        <View style={styles.header}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.greetingText}>
                        {getGreeting()}, {user?.name?.split(" ")[0]}
                    </Text>
                    <Text style={styles.dateText}>
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate("ProfileSettings")}
                    style={styles.avatarButton}
                    activeOpacity={0.8}
                >
                    {avatarSource ? (
                        <Image source={avatarSource} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                        <Text style={styles.avatarFallbackText}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>

        {/* ÁREA DE MÉTRICAS (OWNER) */}
        {user?.role === "OWNER" && dashboardData && (
          <View style={{ paddingHorizontal: 20 }}>
            <GoalProgressBar />
          </View>
        )}

        {/* 👇 ACESSO RÁPIDO 👇 */}
        <View style={styles.quickAccessSection}>
            <Text style={styles.quickAccessTitle}>Acesso Rápido</Text>
            
            <View style={styles.quickAccessRow}>
                <TouchableOpacity 
                    style={styles.quickAccessCard} 
                    onPress={() => navigation.navigate('ServiceList')}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconCircle}>
                        <Feather name="scissors" size={22} color={theme.gold} />
                    </View>
                    <Text style={styles.quickAccessText}>Serviços</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.quickAccessCard} 
                    onPress={() => navigation.navigate('ProductList')} 
                    activeOpacity={0.7}
                >
                    <View style={styles.iconCircle}>
                        <Feather name="package" size={22} color={theme.gold} />
                    </View>
                    <Text style={styles.quickAccessText}>Estoque</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.quickAccessCard} 
                    onPress={() => navigation.navigate('ProfessionalList')}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconCircle}>
                        <Feather name="users" size={22} color={theme.gold} />
                    </View>
                    <Text style={styles.quickAccessText}>Equipe</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.quickAccessCard} 
                    onPress={() => navigation.navigate('ClientList')}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconCircle}>
                        <Feather name="user" size={22} color={theme.gold} />
                    </View>
                    <Text style={styles.quickAccessText}>Clientes</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* 👇 NOVO: BANNER DE UPGRADE (SÓ APARECE SE NÃO FOR PLUS) 👇 */}
        {user?.plan !== 'PLUS' && (
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => navigation.navigate('SubscriptionScreen')}
                style={styles.premiumBanner}
            >
                <View style={styles.premiumBannerIconBg}>
                    <Feather name="award" size={24} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.premiumBannerTitle}>Assine o Kairon PLUS</Text>
                    <Text style={styles.premiumBannerDesc}>Libere relatórios e lembretes no WhatsApp.</Text>
                </View>
                <Feather name="chevron-right" size={20} color={theme.gold} />
            </TouchableOpacity>
        )}

        {/* LISTA DE AGENDAMENTOS */}
        <View style={styles.appointmentsSection}>
          <View style={styles.appointmentsHeader}>
            <Text style={styles.sectionTitle}>
                Agenda de Hoje
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("BottomTabs", { screen: "Schedule" })}>
              <Text style={styles.seeAllText}>Ver tudo</Text>
            </TouchableOpacity>
          </View>

          {todayAppointments.length > 0 ? (
            <View style={{ gap: 12 }}>
              {todayAppointments.slice(0, 5).map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("AppointmentDetails", { appointmentId: appointment.id })}
                  style={styles.appointmentCard}
                >
                    <View style={styles.appointmentCardHeader}>
                        <View style={styles.clientInfoRow}>
                            <View style={styles.clientIconBg}>
                                <Feather name="user" size={18} color={theme.gold} />
                            </View>
                            <View>
                                <Text style={styles.clientNameText}>
                                    {appointment.clientName || "Cliente"}
                                </Text>
                                <Text style={styles.clientPriceText}>
                                    {appointment.clientPhone ? formatCurrency(appointment.totalPrice) : 'Sem telefone'}
                                </Text>
                            </View>
                        </View>
                        <Badge
                            text={getStatusText(appointment.status)}
                            variant={
                                appointment.status === "PENDING" ? "warning" :
                                appointment.status === "CONFIRMED" ? "success" :
                                appointment.status === "COMPLETED" ? "info" : "error"
                            }
                        />
                    </View>

                    <View style={styles.appointmentCardFooter}>
                         <View style={styles.timeRow}>
                             <Feather name="clock" size={14} color={theme.textSecondary} />
                             <Text style={styles.timeText}>
                                 {format(parseISO(appointment.startTime), "HH:mm")}
                             </Text>
                         </View>
                         
                         {/* Botão de Ação Rápida */}
                         {appointment.status === "PENDING" && (
                            <TouchableOpacity
                                onPress={() => handleConfirmAppointment(appointment)}
                                style={styles.confirmButton}
                            >
                                <Text style={styles.confirmButtonText}>Confirmar</Text>
                                <Feather name="check" size={14} color={theme.success} />
                            </TouchableOpacity>
                         )}
                    </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 20 }}>
              <EmptyState
                icon="sentiment-very-satisfied" 
                title="Tudo tranquilo!"
                description="Nenhum agendamento pendente para hoje."
                actionText="Agendar Manualmente"
                onAction={() => navigation.navigate("CreateAppointment", {})}
              />
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.primary,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  dateText: {
    fontSize: 14,
    color: theme.goldLight,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  avatarButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: theme.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarFallbackText: {
    color: theme.gold,
    fontWeight: "800",
    fontSize: 20,
  },

  // Gamification Card
  goalCard: {
    marginBottom: 24, 
    padding: 20, 
    backgroundColor: theme.cardBg, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.gold, // Brilho leve
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  goalLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalRevenue: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.gold,
    marginTop: 4,
  },
  goalBadge: {
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  goalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalFooterText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  goalFooterTarget: {
    fontSize: 12,
    color: theme.goldLight,
    fontWeight: '700',
  },

  // Quick Access
  quickAccessSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAccessCard: {
    width: '23%', 
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },

  // Premium Banner Upsell
  premiumBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Fundo dourado transparente
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  premiumBannerIconBg: {
    backgroundColor: theme.gold,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.gold,
  },
  premiumBannerDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Appointments Section
  appointmentsSection: {
    paddingHorizontal: 20,
    flex: 1,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  seeAllText: {
    color: theme.gold,
    fontWeight: '700',
    fontSize: 14,
  },
  appointmentCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  appointmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientIconBg: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 10,
    borderRadius: 12,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  clientPriceText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  appointmentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // Verde transparente
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  confirmButtonText: {
    color: theme.success,
    fontWeight: '800',
    fontSize: 13,
  },
});