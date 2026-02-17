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
import { Feather, MaterialIcons } from '@expo/vector-icons';
import type { AppNavigation } from '../../@types/navigation';

import { clientService } from '../../services/clients';
import { appointmentService } from '../../services/appointments';
import { EmptyState } from '../../components/shared/EmptyState';

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
      const data = await appointmentService.list({
        clientId,
        limit: 10,
      });
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
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

        <View style={styles.statsRow}>
            <View style={styles.statBox}>
                <Feather name="scissors" size={20} color={theme.gold} style={{marginBottom: 8}} />
                <Text style={styles.statValue}>{client.totalAppointments || 0}</Text>
                <Text style={styles.statLabel}>Visitas</Text>
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
                appointments.map((item, index) => (
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
                        <Text style={[
                            styles.appointmentStatus, 
                            item.status === 'COMPLETED' ? { color: theme.success } : { color: theme.gold }
                        ]}>
                            {item.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                        </Text>
                    </View>
                    
                    <View style={styles.appointmentBody}>
                        <Text style={styles.appointmentService}>Serviço realizado</Text>
                        <Text style={styles.appointmentPrice}>{formatCurrency(item.totalPrice)}</Text>
                    </View>
                  </TouchableOpacity>
                ))
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