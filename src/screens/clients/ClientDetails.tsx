import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppNavigation } from '../../@types/navigation';

import { clientService } from '../../services/clients';
import { appointmentService } from '../../services/appointments';
import { EmptyState } from '../../components/shared/EmptyState';

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
  border: 'rgba(255, 255, 255, 0.05)',
};

/* =========================
   TIPAGEM DE ROTAS
========================= */
interface RouteParams {
  clientId: string;
}

type ClientDetailsRouteProp = RouteProp<
  { ClientDetails: RouteParams },
  'ClientDetails'
>;

export function ClientDetails() {
  const navigation = useNavigation<AppNavigation>();
  const route = useRoute<ClientDetailsRouteProp>();
  const { clientId } = route.params;

  const [loading, setLoading] = useState<boolean>(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState<boolean>(false);
  const [client, setClient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'appointments'>('info');

  // 👇 META DE FIDELIDADE (Futuramente virá das configurações da barbearia no banco)
  const FIDELITY_GOAL = 10; 

  useEffect(() => {
    loadClient();
    loadAppointments();
  }, [clientId]);

  const loadClient = async () => {
    try {
      const data = await clientService.get(clientId);
      setClient(data);
    } catch {
      Alert.alert('Erro', 'Cliente não encontrado');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const data = await appointmentService.listByClient(clientId); 
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!client?.phone) {
        Alert.alert("Aviso", "Este cliente não possui telefone cadastrado.");
        return;
    }
    const phone = client.phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    Linking.openURL(`whatsapp://send?phone=${fullPhone}&text=Olá ${client.name}!`);
  };

  const handleChargeWhatsApp = () => {
    if (!client?.phone) {
        Alert.alert("Aviso", "Este cliente não possui telefone cadastrado para cobrança.");
        return;
    }
    const phone = client.phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    
    const message = `Fala ${client.name.split(' ')[0]}, tudo bem? Passando pra deixar o resumo da sua conta aqui na barbearia, que ficou em ${formatCurrency(client.debtBalance)}. \n\nQuando puder realizar o acerto, me avisa! 👊\n\nChave PIX: (Coloque sua chave aqui)`;
    
    Linking.openURL(`whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`);
  };

  const handleSettleDebt = () => {
    Alert.alert(
      "Quitar Conta",
      `Deseja confirmar o pagamento de ${formatCurrency(client.debtBalance)} e zerar a conta deste cliente?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Quitar", onPress: () => {
            // Futuramente integrar a chamada da API
            Alert.alert("Sucesso", "A conta do cliente foi quitada!");
            setClient({...client, debtBalance: 0}); 
        }}
      ]
    );
  };
  const handleRedeemReward = () => {
    Alert.alert(
      "Resgatar Prêmio 🎉",
      `Deseja resgatar 10 selos de ${client.name} e conceder o serviço gratuito?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Resgatar", onPress: async () => {
            try {
                // Chama a API para descontar os 10 selos
                await clientService.redeemFidelity(client.id);
                Alert.alert("Sucesso!", "Prêmio resgatado! O cliente ganhou o corte grátis.");
                
                // Recarrega a tela para a animação das bolinhas atualizar
                loadClient(); 
            } catch (error) {
                Alert.alert("Erro", "Não foi possível resgatar o prêmio.");
            }
        }}
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { text: 'Concluído', color: theme.success };
      case 'CONFIRMED': return { text: 'Confirmado', color: theme.goldLight };
      case 'CANCELLED': return { text: 'Cancelado', color: theme.danger };
      case 'NO_SHOW':   return { text: 'Não Compareceu', color: theme.danger };
      default:          return { text: 'Pendente', color: theme.gold };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.loadingContainer}>
        <EmptyState
          icon="error-outline"
          title="Cliente não encontrado"
          description="Os dados deste cliente foram removidos ou não existem."
          actionText="Voltar"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  // Lógica matemática para exibir os selos
  const currentStamps = client.fidelityStamps || 0;
  const isRewardReady = currentStamps >= FIDELITY_GOAL;
  const stampsToShow = Math.min(currentStamps, FIDELITY_GOAL);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil do Cliente</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{client.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientEmail}>{client.email || 'Sem e-mail cadastrado'}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
              <Feather name="message-circle" size={18} color={theme.primary} />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 👇 NOVO: CARTÃO DE FIDELIDADE GAMIFICADO 👇 */}
        {/* ========================================================= */}
        <View style={styles.fidelityCard}>
          <View style={styles.fidelityHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="award" size={20} color={theme.gold} />
                  <Text style={styles.fidelityTitle}>Clube de Fidelidade</Text>
              </View>
              <Text style={styles.fidelityCount}>{stampsToShow} / {FIDELITY_GOAL}</Text>
          </View>
          
          <Text style={styles.fidelitySubtitle}>
              {isRewardReady 
                  ? "Recompensa liberada! 🎉" 
                  : `Faltam ${FIDELITY_GOAL - stampsToShow} visitas para o próximo prêmio.`}
          </Text>

          <View style={styles.stampsGrid}>
              {Array.from({ length: FIDELITY_GOAL }).map((_, index) => {
                  const isFilled = index < stampsToShow;
                  return (
                      <View key={index} style={[styles.stampBox, isFilled && styles.stampBoxFilled]}>
                          {isFilled ? (
                              <Feather name="check" size={18} color={theme.primary} />
                          ) : (
                              <Feather name="scissors" size={14} color="rgba(255,255,255,0.1)" />
                          )}
                      </View>
                  );
              })}
          </View>

          {isRewardReady && (
              <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeemReward}>
                  <Text style={styles.redeemBtnText}>RESGATAR PRÊMIO</Text>
                  <Feather name="gift" size={16} color={theme.primary} />
              </TouchableOpacity>
          )}
        </View>

        {/* CARD DE DÍVIDA (FIADO) */}
        {client.debtBalance > 0 && (
          <View style={styles.debtCard}>
             <View style={styles.debtHeader}>
                <View style={styles.debtIconBg}>
                   <MaterialCommunityIcons name="notebook-edit-outline" size={24} color={theme.danger} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.debtLabel}>Conta em Aberto (Fiado)</Text>
                   <Text style={styles.debtValue}>{formatCurrency(client.debtBalance)}</Text>
                </View>
             </View>

             <View style={styles.debtActions}>
                <TouchableOpacity 
                  style={[styles.debtBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                  onPress={handleChargeWhatsApp}
                >
                   <MaterialCommunityIcons name="whatsapp" size={18} color={theme.danger} />
                   <Text style={[styles.debtBtnText, { color: theme.danger }]}>Cobrar Cliente</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.debtBtn, { backgroundColor: theme.success, borderColor: theme.success }]}
                  onPress={handleSettleDebt}
                >
                   <Feather name="check" size={18} color="#FFF" />
                   <Text style={[styles.debtBtnText, { color: "#FFF" }]}>Quitar Conta</Text>
                </TouchableOpacity>
             </View>
          </View>
        )}

        <View style={styles.statsRow}>
            <View style={styles.statBox}>
                <Feather name="scissors" size={20} color={theme.gold} style={{marginBottom: 8}} />
                <Text style={styles.statValue}>{client.totalAppointments || 0}</Text>
                <Text style={styles.statLabel}>Visitas Totais</Text>
            </View>
            <View style={styles.statBox}>
                <Feather name="dollar-sign" size={20} color={theme.success} style={{marginBottom: 8}} />
                <Text style={styles.statValue}>{formatCurrency(client.totalSpent)}</Text>
                <Text style={styles.statLabel}>Total Gasto</Text>
            </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'info' && styles.activeTab]} 
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Informações</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'appointments' && styles.activeTab]} 
            onPress={() => setActiveTab('appointments')}
          >
            <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>Histórico</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'info' && (
             <View style={styles.infoContainer}>
                 <View style={styles.infoRow}>
                     <Feather name="phone" size={18} color={theme.textSecondary} />
                     <View style={{ marginLeft: 12 }}>
                         <Text style={styles.infoLabel}>Telefone</Text>
                         <Text style={styles.infoValue}>{client.phone || 'Não informado'}</Text>
                     </View>
                 </View>
                 <View style={styles.separator} />
                 <View style={styles.infoRow}>
                     <Feather name="mail" size={18} color={theme.textSecondary} />
                     <View style={{ marginLeft: 12 }}>
                         <Text style={styles.infoLabel}>E-mail</Text>
                         <Text style={styles.infoValue}>{client.email || 'Não informado'}</Text>
                     </View>
                 </View>
             </View>
          )}

          {activeTab === 'appointments' && (
            <View>
              {appointmentsLoading ? (
                <ActivityIndicator size="large" color={theme.gold} style={{ marginTop: 20 }} />
              ) : appointments.length === 0 ? (
                <View style={{ marginTop: 20 }}>
                    <EmptyState
                      icon="event-note"
                      title="Nenhum histórico"
                      description="Esse cliente ainda não realizou serviços."
                    />
                </View>
              ) : (
                appointments.map((item, index) => {
                  const statusInfo = getStatusInfo(item.status);
                  const serviceName = item.serviceNames && item.serviceNames.length > 0 
                                      ? item.serviceNames.join(", ") 
                                      : 'Serviço Agendado';

                  return (
                    <TouchableOpacity
                      key={item.id || index}
                      style={styles.appointmentCard}
                      onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}
                    >
                      <View style={styles.appointmentHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Feather name="calendar" size={14} color={theme.textSecondary} style={{ marginRight: 6 }}/>
                              <Text style={styles.appointmentDate}>
                                  {item.startTime ? new Date(item.startTime).toLocaleDateString('pt-BR') : 'Data Indefinida'}
                              </Text>
                          </View>
                          <Text style={[styles.appointmentStatus, { color: statusInfo.color }]}>
                              {statusInfo.text}
                          </Text>
                      </View>
                      
                      <View style={styles.appointmentBody}>
                          <View style={{ flex: 1, paddingRight: 10 }}>
                             <Text style={styles.appointmentService} numberOfLines={1}>{serviceName}</Text>
                          </View>
                          <Text style={styles.appointmentPrice}>{formatCurrency(item.totalPrice)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateAppointment', { clientId: client.id })}
      >
        <Feather name="plus" size={24} color={theme.primary} />
        <Text style={styles.fabText}>Agendar</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, 
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.gold,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.gold,
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  actionBtnText: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 14,
  },

  // 👇 ESTILOS DO CARTÃO DE FIDELIDADE 👇
  fidelityCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 24,
  },
  fidelityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fidelityTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.gold,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  fidelityCount: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  fidelitySubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  stampBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampBoxFilled: {
    backgroundColor: theme.gold,
    borderColor: theme.goldLight,
    shadowColor: theme.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemBtn: {
    backgroundColor: theme.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  redeemBtnText: {
    color: theme.primary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },

  // ESTILOS DO CARD DE DÍVIDA
  debtCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 24,
  },
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  debtIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debtLabel: {
    fontSize: 13,
    color: theme.danger,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  debtValue: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textPrimary,
    marginTop: 2,
  },
  debtActions: {
    flexDirection: 'row',
    gap: 12,
  },
  debtBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  debtBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.cardBg,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: theme.gold,
  },
  tabContent: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
  },
  appointmentCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  appointmentDate: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  appointmentStatus: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  appointmentBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentService: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  appointmentPrice: {
    color: theme.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: theme.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: theme.primary,
    fontWeight: '800',
    fontSize: 16,
  }
});