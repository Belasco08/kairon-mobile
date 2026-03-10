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
  Modal,
  TextInput,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appointmentService } from "../../services/appointments";
import { api } from "../../services/api"; 
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
  info: "#38BDF8",
  purple: "#A855F7", // 👈 Adicionada cor para o Pacote
  border: "rgba(255, 255, 255, 0.05)",
};

// --- TIPAGEM ---
type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

type RootStackParamList = {
  AppointmentDetails: { appointmentId: string };
  EditAppointment: { appointmentId: string };
};

type AppointmentDetailsRouteProp = RouteProp<RootStackParamList, "AppointmentDetails">;
type AppointmentDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, "AppointmentDetails">;

interface AppointmentServiceItem {
  service: { id: string; name: string; price: number; duration: number; };
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
  isPaid?: boolean; 
  paymentMethod?: string; // 👈 GARANTINDO A TIPAGEM DO MÉTODO DE PAGAMENTO
  client?: { id: string; name: string; phone: string; email?: string; };
  clientName?: string;
  clientPhone?: string;
  professional?: { id: string; name: string; };
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
  
  // ESTADOS DO MODAL DE PAGAMENTO
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'OPTIONS' | 'CARD_FEE'>('OPTIONS');
  const [isCompleting, setIsCompleting] = useState(false);
  
  const [cardType, setCardType] = useState<'CREDITO' | 'DEBITO'>('CREDITO');
  const [feePercentage, setFeePercentage] = useState('');
  
  // ESTADO PARA GUARDAR AS TAXAS SALVAS NA MEMÓRIA DO CELULAR
  const [savedFees, setSavedFees] = useState({ CREDITO: '', DEBITO: '' });

  useEffect(() => {
    loadAppointment();
    loadSavedFees();
  }, []);

  // TROCA A TAXA AUTOMATICAMENTE QUANDO O USUÁRIO MUDA DE DÉBITO PRA CRÉDITO
  useEffect(() => {
    setFeePercentage(savedFees[cardType]);
  }, [cardType, savedFees]);

  const loadAppointment = async () => {
    try {
      const response = await appointmentService.get(appointmentId);
      setAppointment(response as unknown as Appointment);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFees = async () => {
    try {
      const credit = await AsyncStorage.getItem('@kairon_fee_CREDITO') || '';
      const debit = await AsyncStorage.getItem('@kairon_fee_DEBITO') || '';
      setSavedFees({ CREDITO: credit, DEBITO: debit });
    } catch (e) {
      console.log("Erro ao carregar taxas salvas", e);
    }
  };

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    try {
      setIsCompleting(true);
      await appointmentService.updateStatus(appointmentId, newStatus);
      setAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
      Alert.alert("Sucesso", "Status atualizado!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o status");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleConfirmPayment = async (isPaid: boolean, method: string = 'DINHEIRO', fee: number = 0) => {
      try {
          setIsCompleting(true);
          
          if (method === 'CREDITO' || method === 'DEBITO') {
             await AsyncStorage.setItem(`@kairon_fee_${method}`, feePercentage);
             setSavedFees(prev => ({ ...prev, [method]: feePercentage }));
          }

          // CHAMA A ROTA CORRETA DE ATUALIZAÇÃO (USANDO PUT COMO DEFINIMOS NO SERVICE)
          await appointmentService.updateStatus(appointmentId, 'COMPLETED', undefined, isPaid, method);

          setAppointment((prev) => (prev ? { ...prev, status: 'COMPLETED', isPaid, paymentMethod: method } : null));
          setShowPaymentModal(false);
          setPaymentStep('OPTIONS');
          
          let successMessage = "Atendimento finalizado com sucesso!";
          if (!isPaid) successMessage = "Atendimento pendurado na conta do cliente!";
          if (method === 'PACOTE') successMessage = "Atendimento concluído! 1 Crédito descontado do pacote do cliente.";

          Alert.alert("Sucesso", successMessage);
      } catch (error: any) {
          // Trata o erro caso o cliente não tenha mais créditos no pacote
          const errorMsg = error.response?.data?.message || "Não foi possível finalizar o atendimento.";
          Alert.alert("Erro", errorMsg);
      } finally {
          setIsCompleting(false);
      }
  };

  const getClientName = () => appointment?.clientName || appointment?.client?.name || "Cliente";
  const getClientPhone = () => appointment?.clientPhone || appointment?.client?.phone || "";
  const getProfessionalName = () => appointment?.professionalName || appointment?.professional?.name || "Profissional";

  const handleCallClient = () => {
    const phone = getClientPhone();
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleMessageClient = () => {
    const phone = getClientPhone();
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    Linking.openURL(`whatsapp://send?phone=${fullPhone}`);
  };

  const handleMessageClientCancel = async () => {
    const phone = getClientPhone();
    if (!phone) return;

    let startTimeDate = new Date();
    try {
      if (appointment) startTimeDate = parseISO(appointment.startTime);
    } catch {}

    const dataFmt = isValid(startTimeDate) ? format(startTimeDate, "dd/MM/yyyy") : "";
    const horaFmt = isValid(startTimeDate) ? format(startTimeDate, "HH:mm") : "";
    const cancelMessage = `Olá *${getClientName()}*. Informamos que o seu agendamento para o dia ${dataFmt} às ${horaFmt} com ${getProfessionalName()} foi *cancelado*. Qualquer dúvida, estamos à disposição.`;

    const cleanPhone = phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(cancelMessage)}`;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erro", "WhatsApp não está instalado.");
    }
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
          onPress: async () => {
            await handleStatusChange("CANCELLED");
            if (getClientPhone()) {
               Alert.alert(
                 "Avisar Cliente",
                 "Deseja enviar uma mensagem informando o cancelamento?",
                 [
                   { text: "Não", style: "cancel" },
                   { text: "Sim, Enviar", onPress: handleMessageClientCancel }
                 ]
               );
            }
          },
        },
      ],
    );
  };

  const getStatusVariant = (status: AppointmentStatus): "info" | "success" | "warning" | "error" => {
    switch (status) {
      case "PENDING": return "warning";
      case "CONFIRMED": return "success";
      case "COMPLETED": return "info";
      case "CANCELLED": return "error";
      case "NO_SHOW": return "error";
      default: return "info";
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
    const map: Record<string, string> = { PENDING: "Pendente", CONFIRMED: "Confirmado", COMPLETED: "Concluído", CANCELLED: "Cancelado", NO_SHOW: "Não Compareceu" };
    return map[status] || status;
  };

  // 👇 FUNÇÃO PARA FORMATAR A EXIBIÇÃO DO MÉTODO DE PAGAMENTO 👇
  const renderPaymentInfo = () => {
    if (appointment?.status !== 'COMPLETED') return null;

    if (appointment?.isPaid === false) {
       return (
         <View style={[styles.paymentBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
             <MaterialCommunityIcons name="notebook-edit-outline" size={16} color={theme.danger} style={{ marginRight: 6 }} />
             <Text style={[styles.paymentBadgeText, { color: theme.danger }]}>Pendurado (Fiado)</Text>
         </View>
       );
    }

    const method = appointment?.paymentMethod;
    let iconName = "dollar-sign";
    let iconColor = theme.success;
    let text = "Dinheiro";
    let bgColor = 'rgba(16, 185, 129, 0.15)';
    let borderColor = 'rgba(16, 185, 129, 0.3)';

    if (method === 'PIX') {
       iconName = "smartphone"; 
       iconColor = theme.info;
       text = "PIX";
       bgColor = 'rgba(56, 189, 248, 0.15)';
       borderColor = 'rgba(56, 189, 248, 0.3)';
    } else if (method === 'CREDITO' || method === 'DEBITO') {
       iconName = "credit-card";
       iconColor = theme.goldLight;
       text = method === 'CREDITO' ? 'Cartão de Crédito' : 'Cartão de Débito';
       bgColor = 'rgba(253, 230, 138, 0.15)';
       borderColor = 'rgba(253, 230, 138, 0.3)';
    } else if (method === 'PACOTE' || method === 'COMBO') {
       iconName = "package";
       iconColor = theme.purple;
       text = "Pacote de Cortes";
       bgColor = 'rgba(168, 85, 247, 0.15)';
       borderColor = 'rgba(168, 85, 247, 0.3)';
    }

    return (
       <View style={[styles.paymentBadge, { backgroundColor: bgColor, borderColor: borderColor }]}>
           <Feather name={iconName as any} size={14} color={iconColor} style={{ marginRight: 6 }} />
           <Text style={[styles.paymentBadgeText, { color: iconColor }]}>Pago via {text}</Text>
       </View>
    );
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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
        <Button title="Voltar" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  let startTimeDate = new Date();
  try { startTimeDate = parseISO(appointment.startTime); } catch {}
  const formattedDate = isValid(startTimeDate) ? format(startTimeDate, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR }) : appointment.startTime;
  const servicesList = appointment.appointmentServices || appointment.services || [];
  const calculatedDuration = servicesList.reduce((acc: number, item: any) => acc + (item.service?.duration || item.duration || 0), 0);

  const cleanFee = parseFloat(feePercentage.replace(',', '.')) || 0;
  const feeDiscount = (appointment.totalPrice * cleanFee) / 100;
  const netValue = appointment.totalPrice - feeDiscount;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Detalhes</Text>
          <View style={{ marginTop: 4 }}>
            <Badge text={getStatusText(appointment.status)} variant={getStatusVariant(appointment.status)} />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("EditAppointment", { appointmentId: appointment.id })}
          disabled={["COMPLETED", "CANCELLED"].includes(appointment.status)}
          style={{ opacity: ["COMPLETED", "CANCELLED"].includes(appointment.status) ? 0.3 : 1, padding: 4 }}
        >
          <Feather name="edit" size={22} color={theme.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Feather name="calendar" size={20} color={theme.gold} /></View>
            <View>
              <Text style={styles.infoLabel}>Data e Hora</Text>
              <Text style={[styles.infoValue, { textTransform: "capitalize" }]}>{formattedDate}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Feather name="scissors" size={20} color={theme.gold} /></View>
            <View>
              <Text style={styles.infoLabel}>Profissional</Text>
              <Text style={styles.infoValue}>{getProfessionalName()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.clientName}>{getClientName()}</Text>
            {getClientPhone() ? <Text style={styles.clientPhone}>{getClientPhone()}</Text> : null}
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button title="Ligar" onPress={handleCallClient} variant="outline" style={{ flex: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "transparent" }} textStyle={{ color: theme.textPrimary }} disabled={!getClientPhone()} />
            <TouchableOpacity style={[styles.whatsappButton, !getClientPhone() && { opacity: 0.5 }]} onPress={handleMessageClient} disabled={!getClientPhone()}>
              <Text style={styles.whatsappButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
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
                <View key={index} style={[styles.serviceRow, index === servicesList.length - 1 && { borderBottomWidth: 0 }]}>
                  <View>
                    <Text style={styles.serviceName}>{name}</Text>
                    <Text style={styles.serviceDuration}>{duration} min</Text>
                  </View>
                  <Text style={styles.servicePrice}>{formatCurrency(price)}</Text>
                </View>
              );
            })
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(appointment.totalPrice)}</Text>
          </View>
          
          {/* 👇 INSERINDO A INFORMAÇÃO DE PAGAMENTO ABAIXO DO TOTAL 👇 */}
          {appointment.status === 'COMPLETED' && (
             <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
                 {renderPaymentInfo()}
             </View>
          )}

        </View>

        {appointment.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Observações</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        )}

        {appointment.status === "PENDING" || appointment.status === "CONFIRMED" ? (
          <View style={{ gap: 12, marginTop: 10 }}>
            <Button title="Finalizar Atendimento" onPress={() => setShowPaymentModal(true)} style={{ backgroundColor: theme.success }} textStyle={{ fontWeight: "800" }} />
            <Button title="Cancelar Agendamento" onPress={handleCancel} variant="outline" style={{ borderColor: theme.danger, backgroundColor: "transparent" }} textStyle={{ color: theme.danger, fontWeight: "700" }} />
          </View>
        ) : null}
      </ScrollView>

      {/* ==============================================================================
          MODAL DE PAGAMENTO & MÁQUINA DE CARTÃO
      ============================================================================== */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { setShowPaymentModal(false); setPaymentStep('OPTIONS'); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
                {paymentStep === 'CARD_FEE' ? (
                    <TouchableOpacity onPress={() => setPaymentStep('OPTIONS')} style={{ paddingRight: 10 }}>
                        <Feather name="arrow-left" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                ) : <View style={{ width: 24 }} />}
                
                <Text style={styles.modalTitle}>Finalizar Atendimento</Text>
                
                <TouchableOpacity onPress={() => { setShowPaymentModal(false); setPaymentStep('OPTIONS'); }}>
                    <Feather name="x" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
            </View>

            {paymentStep === 'OPTIONS' ? (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '85%' }}>
                    <Text style={styles.modalSubtitle}>Como o cliente {getClientName()} pagou {formatCurrency(appointment.totalPrice)}?</Text>

                    <TouchableOpacity style={[styles.paymentOptionBtn, { borderColor: theme.success }]} onPress={() => handleConfirmPayment(true, 'DINHEIRO')} disabled={isCompleting}>
                        <View style={[styles.paymentIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                            <Feather name="dollar-sign" size={24} color={theme.success} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.paymentOptionTitle, { color: theme.success }]}>Dinheiro</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.success} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.paymentOptionBtn, { borderColor: theme.info }]} onPress={() => handleConfirmPayment(true, 'PIX')} disabled={isCompleting}>
                        <View style={[styles.paymentIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                            <MaterialCommunityIcons name="qrcode-scan" size={22} color={theme.info} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.paymentOptionTitle, { color: theme.info }]}>PIX</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.info} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.paymentOptionBtn, { borderColor: theme.goldLight }]} onPress={() => setPaymentStep('CARD_FEE')} disabled={isCompleting}>
                        <View style={[styles.paymentIconBg, { backgroundColor: 'rgba(253, 230, 138, 0.15)' }]}>
                            <Feather name="credit-card" size={24} color={theme.goldLight} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.paymentOptionTitle, { color: theme.goldLight }]}>Cartão (Débito/Crédito)</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.goldLight} />
                    </TouchableOpacity>

                    {/* 👇 NOVO BOTÃO DE PACOTE / COMBO 👇 */}
                    <TouchableOpacity style={[styles.paymentOptionBtn, { borderColor: theme.purple }]} onPress={() => handleConfirmPayment(true, 'PACOTE')} disabled={isCompleting}>
                        <View style={[styles.paymentIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                            <Feather name="package" size={24} color={theme.purple} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.paymentOptionTitle, { color: theme.purple }]}>Usar Crédito de Pacote</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.purple} />
                    </TouchableOpacity>

                    <View style={styles.modalDivider} />

                    <TouchableOpacity style={[styles.paymentOptionBtn, { borderColor: theme.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' }]} onPress={() => handleConfirmPayment(false, 'FIADO')} disabled={isCompleting}>
                        <View style={[styles.paymentIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                            <MaterialCommunityIcons name="notebook-edit-outline" size={24} color={theme.danger} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.paymentOptionTitle, { color: theme.danger }]}>Pendurar na Conta</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.danger} />
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View>
                    <Text style={styles.modalSubtitle}>A maquininha cobra taxa? O Kairon desconta ela antes de dividir a comissão.</Text>

                    <View style={styles.cardToggleRow}>
                        <TouchableOpacity 
                            style={[styles.cardToggleBtn, cardType === 'DEBITO' && styles.cardToggleBtnActive]}
                            onPress={() => setCardType('DEBITO')}
                        >
                            <Text style={[styles.cardToggleText, cardType === 'DEBITO' && styles.cardToggleTextActive]}>Débito</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.cardToggleBtn, cardType === 'CREDITO' && styles.cardToggleBtnActive]}
                            onPress={() => setCardType('CREDITO')}
                        >
                            <Text style={[styles.cardToggleText, cardType === 'CREDITO' && styles.cardToggleTextActive]}>Crédito</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Taxa Cobrada (%)</Text>
                        <TextInput
                            style={styles.textInput}
                            keyboardType="numeric"
                            placeholder="Ex: 4.99"
                            placeholderTextColor={theme.textSecondary}
                            value={feePercentage}
                            onChangeText={setFeePercentage}
                            maxLength={5}
                        />
                    </View>

                    <View style={styles.realProfitBox}>
                        <View style={styles.profitRow}>
                            <Text style={styles.profitLabel}>Valor do Corte:</Text>
                            <Text style={styles.profitValue}>{formatCurrency(appointment.totalPrice)}</Text>
                        </View>
                        <View style={styles.profitRow}>
                            <Text style={styles.profitLabel}>Taxa da Maquininha:</Text>
                            <Text style={[styles.profitValue, { color: theme.danger }]}>- {formatCurrency(feeDiscount)}</Text>
                        </View>
                        <View style={[styles.profitRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8 }]}>
                            <Text style={[styles.profitLabel, { color: theme.textPrimary, fontWeight: '800' }]}>LUCRO REAL:</Text>
                            <Text style={[styles.profitValue, { color: theme.success, fontSize: 18 }]}>{formatCurrency(netValue)}</Text>
                        </View>
                    </View>

                    <Button 
                        title="Confirmar Pagamento" 
                        onPress={() => handleConfirmPayment(true, cardType, cleanFee)} 
                        loading={isCompleting}
                        disabled={isCompleting}
                        style={{ backgroundColor: theme.goldLight, marginTop: 10 }}
                        textStyle={{ color: theme.primary, fontWeight: '900' }}
                    />
                </View>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0 },
  loadingContainer: { flex: 1, backgroundColor: theme.primary, justifyContent: "center", alignItems: "center" },
  errorText: { color: theme.textPrimary, fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 18, fontWeight: "800", color: theme.textPrimary },
  card: { backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: theme.textPrimary, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(212, 175, 55, 0.1)", justifyContent: "center", alignItems: "center", marginRight: 16 },
  infoLabel: { fontSize: 12, fontWeight: "600", color: theme.textSecondary, marginBottom: 2, textTransform: "uppercase" },
  infoValue: { fontSize: 15, fontWeight: "700", color: theme.textPrimary },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 16 },
  clientName: { fontSize: 22, fontWeight: "800", color: theme.textPrimary },
  clientPhone: { fontSize: 14, color: theme.goldLight, marginTop: 4, fontWeight: "500" },
  whatsappButton: { flex: 1, backgroundColor: "rgba(16, 185, 129, 0.15)", borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.3)" },
  whatsappButtonText: { color: theme.success, fontWeight: "700", fontSize: 15 },
  durationBadge: { backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, color: theme.textSecondary, fontWeight: "600" },
  emptyText: { color: theme.textSecondary, fontSize: 14 },
  serviceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  serviceName: { fontSize: 15, fontWeight: "700", color: theme.textPrimary, marginBottom: 2 },
  serviceDuration: { fontSize: 12, color: theme.textSecondary, fontWeight: "500" },
  servicePrice: { fontSize: 15, fontWeight: "800", color: theme.gold },
  totalRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 18, fontWeight: "800", color: theme.textPrimary },
  totalValue: { fontSize: 24, fontWeight: "900", color: theme.gold },
  notesText: { fontSize: 14, color: theme.textSecondary, lineHeight: 22 },

  // 👇 ESTILOS DA ETIQUETA DE PAGAMENTO 👇
  paymentBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, display: 'flex', alignSelf: 'flex-end' },
  paymentBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.cardBg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: theme.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  modalSubtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 20, lineHeight: 20 },
  
  paymentOptionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12, backgroundColor: theme.primary },
  paymentIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  paymentOptionTitle: { fontSize: 16, fontWeight: '800' },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },

  cardToggleRow: { flexDirection: 'row', backgroundColor: theme.primary, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: theme.border },
  cardToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  cardToggleBtnActive: { backgroundColor: 'rgba(253, 230, 138, 0.15)' },
  cardToggleText: { color: theme.textSecondary, fontWeight: '600', fontSize: 14 },
  cardToggleTextActive: { color: theme.goldLight, fontWeight: '800' },

  inputContainer: { marginBottom: 20 },
  inputLabel: { color: theme.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  textInput: { backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, color: theme.textPrimary, fontSize: 18, fontWeight: '700' },

  realProfitBox: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 16, padding: 16, marginBottom: 24 },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  profitLabel: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
  profitValue: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
});