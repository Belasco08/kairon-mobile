import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  Linking,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, FontAwesome } from '@expo/vector-icons'; 

import { useAuth } from '../../contexts/AuthContext';
import { clientService } from '../../services/clients'; 
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/shared/EmptyState';

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM (Azul Marinho e Dourado)
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

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalAppointments: number;
  totalSpent: number;
}

// Interface para os clientes sumidos
interface MissingClient {
  id: string;
  name: string;
  phone: string;
  daysAway: number;
  lastService: string;
  lastVisitDate: string;
}

// Opção 'missing' nos filtros
type SortOption = 'name' | 'spent' | 'visits' | 'missing';

export function ClientList() {
  const navigation = useNavigation<any>();
  const { user } = useAuth(); 

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [missingClients, setMissingClients] = useState<MissingClient[]>([]); 
  const [search, setSearch] = useState<string>('');
  
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // ==========================================
  // 👇 ESTADOS DO MODAL DE RECUPERAÇÃO 👇
  // ==========================================
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryClientName, setRecoveryClientName] = useState("");

  const loadClients = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      if (sortBy === 'missing') {
        // Busca na rota de clientes sumidos
        const response = await clientService.getMissingClients(30); 
        setMissingClients(response);
      } else {
        // Busca normal
        const response = await clientService.list({}); 
        setClients(response);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [sortBy]) 
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  // ==========================================
  // 👇 FUNÇÕES DE RECUPERAÇÃO (WHATSAPP) 👇
  // ==========================================
  const handleOpenRecovery = (client: MissingClient) => {
      const baseMessage = `Fala ${client.name.split(' ')[0]}, sumido! Tudo bem?\n\nVi aqui que já faz uns ${client.daysAway} dias desde o seu último ${client.lastService} com a gente.\n\nTô com uns horários bons livres pra essa semana. Bora dar aquele tapa no visual? ✂️`;
      
      setRecoveryMessage(baseMessage);
      setRecoveryPhone(client.phone || "");
      setRecoveryClientName(client.name);
      setRecoveryModalVisible(true);
  };

  const sendRecoveryWhatsApp = async () => {
      if (!recoveryPhone) {
          Alert.alert("Erro", "Este cliente não possui telefone cadastrado.");
          return;
      }

      const cleanPhone = recoveryPhone.replace(/\D/g, "");
      const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
      
      const url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(recoveryMessage)}`;
      
      try {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
              await Linking.openURL(url);
          } else {
              Alert.alert("Erro", "WhatsApp não parece estar instalado neste celular.");
          }
      } catch (error) {
          Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
      } finally {
          setRecoveryModalVisible(false);
      }
  };

  const processedClients = useMemo(() => {
    if (sortBy === 'missing') return []; 

    let result = clients.filter(client =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(search.toLowerCase())) ||
      (client.phone && client.phone.includes(search))
    );

    return result.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name); 
        if (sortBy === 'spent') return b.totalSpent - a.totalSpent; 
        if (sortBy === 'visits') return b.totalAppointments - a.totalAppointments; 
        return 0;
    });
  }, [clients, search, sortBy]);

  const processedMissingClients = useMemo(() => {
      if (sortBy !== 'missing') return [];

      return missingClients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        (client.phone && client.phone.includes(search))
      ).sort((a, b) => b.daysAway - a.daysAway); 
  }, [missingClients, search, sortBy]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // ==========================================
  // 👇 RENDER: CARD CLIENTE NORMAL
  // ==========================================
  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ClientDetails', { clientId: item.id })}
    >
      <View style={styles.cardMainRow}>
        <View style={styles.avatarContainer}>
           <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
           </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
            {item.totalAppointments > 0 && (
                <View style={[styles.badge, item.totalAppointments > 5 ? styles.badgeSuccess : styles.badgeInfo]}>
                    <Text style={[styles.badgeText, item.totalAppointments > 5 ? styles.badgeTextSuccess : styles.badgeTextInfo]}>
                        {item.totalAppointments} visitas
                    </Text>
                </View>
            )}
          </View>

          <View style={styles.contactContainer}>
             {item.phone && (
                <View style={styles.contactRow}>
                    <Feather name="phone" size={12} color={theme.textSecondary} />
                    <Text style={styles.contactText}>{item.phone}</Text>
                </View>
             )}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} style={{ alignSelf: 'center' }} />
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Total Gasto</Text>
            <Text style={[styles.footerValuePrimary, sortBy === 'spent' && { color: theme.gold, fontSize: 16 }]}>
                {formatCurrency(item.totalSpent)}
            </Text>
         </View>
      </View>
    </TouchableOpacity>
  );

  // ==========================================
  // 👇 RENDER: CARD CLIENTE SUMIDO (NOVO)
  // ==========================================
  const renderMissingClient = ({ item }: { item: MissingClient }) => (
    <View style={[styles.card, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
      <View style={styles.cardMainRow}>
        <View style={styles.avatarContainer}>
           <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={[styles.avatarText, { color: theme.danger }]}>{item.name.charAt(0).toUpperCase()}</Text>
           </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.missingInfoRow}>
             <Feather name="alert-circle" size={12} color={theme.danger} />
             <Text style={styles.missingDaysText}>Sumido há {item.daysAway} dias</Text>
          </View>
          <Text style={styles.lastServiceText} numberOfLines={1}>Último: {item.lastService}</Text>
        </View>
      </View>

      <View style={styles.missingCardFooter}>
         <TouchableOpacity 
            style={styles.recoveryButton}
            onPress={() => handleOpenRecovery(item)}
            activeOpacity={0.8}
         >
            <FontAwesome name="whatsapp" size={18} color="#FFF" />
            <Text style={styles.recoveryButtonText}>Recuperar Cliente</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* HEADER FIXO */}
      <View style={styles.headerContainer}>
         <View style={styles.headerTop}>
             <View>
                 <Text style={styles.headerTitle}>Clientes</Text>
                 <Text style={styles.headerSubtitle}>
                    {loading ? "Carregando..." : `${sortBy === 'missing' ? processedMissingClients.length : processedClients.length} encontrados`}
                 </Text>
             </View>
             <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('CreateClient')}
             >
                 <Feather name="plus" size={20} color={theme.primary} />
                 <Text style={styles.addButtonText}>Novo</Text>
             </TouchableOpacity>
         </View>

         {/* BARRA DE BUSCA */}
         <View style={styles.searchContainer}>
             <Feather name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
             <Input
                placeholder="Buscar cliente..."
                placeholderTextColor={theme.textSecondary}
                value={search}
                onChangeText={setSearch}
                containerStyle={{ marginBottom: 0, flex: 1, borderWidth: 0 }} 
                style={styles.searchInput} 
             />
         </View>

         {/* FILTROS / ORDENAÇÃO (CHIPS) */}
         <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                
                <TouchableOpacity 
                    style={[styles.filterChip, sortBy === 'name' && styles.filterChipActive]}
                    onPress={() => setSortBy('name')}
                >
                    <Text style={[styles.filterText, sortBy === 'name' && styles.filterTextActive]}>A-Z Nome</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.filterChip, sortBy === 'spent' && styles.filterChipActive]}
                    onPress={() => setSortBy('spent')}
                >
                    <Feather name="dollar-sign" size={14} color={sortBy === 'spent' ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.filterText, sortBy === 'spent' && styles.filterTextActive]}>Maior Gasto</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.filterChip, sortBy === 'visits' && styles.filterChipActive]}
                    onPress={() => setSortBy('visits')}
                >
                    <Feather name="star" size={14} color={sortBy === 'visits' ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.filterText, sortBy === 'visits' && styles.filterTextActive]}>Mais Fiéis</Text>
                </TouchableOpacity>

                {/* 👇 NOVA ABA: SUMIDOS 👇 */}
                <TouchableOpacity 
                    style={[styles.filterChip, sortBy === 'missing' && styles.filterChipMissingActive]}
                    onPress={() => setSortBy('missing')}
                >
                    <Feather name="alert-triangle" size={14} color={sortBy === 'missing' ? '#FFF' : theme.danger} />
                    <Text style={[styles.filterText, { color: theme.danger }, sortBy === 'missing' && { color: '#FFF', fontWeight: '800' }]}>
                        Sumidos (+30d)
                    </Text>
                </TouchableOpacity>

            </ScrollView>
         </View>
      </View>

      {/* LISTA */}
      <View style={styles.contentContainer}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.gold} />
            </View>
          ) : (
            <FlatList<any> 
              data={sortBy === 'missing' ? processedMissingClients : processedClients}
              keyExtractor={(item) => item.id}
              renderItem={sortBy === 'missing' ? renderMissingClient : renderClient} 
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  icon={sortBy === 'missing' ? "sentiment-satisfied" : "people"}
                  title={sortBy === 'missing' ? "Nenhum sumido!" : "Nenhum cliente"}
                  description={sortBy === 'missing' ? "Sua retenção está excelente. Todos retornaram recentemente." : "Use o botão Novo para cadastrar."}
                />
              }
            />
          )}
      </View>

      {/* ============================================================================== */}
      {/* 🟢 MODAL DE MENSAGEM DO WHATSAPP */}
      {/* ============================================================================== */}
      <Modal
          visible={recoveryModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setRecoveryModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Recuperar {recoveryClientName}</Text>
                      <TouchableOpacity onPress={() => setRecoveryModalVisible(false)}>
                          <Feather name="x" size={24} color={theme.textPrimary} />
                      </TouchableOpacity>
                  </View>

                  <Text style={styles.modalDescription}>
                      Edite a mensagem abaixo do seu jeito antes de enviar para o cliente:
                  </Text>

                  <TextInput
                      style={styles.messageInput}
                      multiline
                      value={recoveryMessage}
                      onChangeText={setRecoveryMessage}
                      textAlignVertical="top"
                  />

                  <View style={styles.modalButtonsRow}>
                      <TouchableOpacity 
                          style={styles.modalCancelButton}
                          onPress={() => setRecoveryModalVisible(false)}
                      >
                          <Text style={styles.modalCancelText}>Cancelar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                          style={styles.modalSendButton}
                          onPress={sendRecoveryWhatsApp}
                      >
                          <FontAwesome name="whatsapp" size={18} color="#FFF" />
                          <Text style={styles.modalSendText}>Abrir WhatsApp</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 },
  headerContainer: { backgroundColor: theme.primary, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.textPrimary },
  headerSubtitle: { fontSize: 14, color: theme.goldLight },
  addButton: { backgroundColor: theme.gold, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  addButtonText: { color: theme.primary, fontWeight: '800', fontSize: 14 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', marginHorizontal: 16, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { backgroundColor: 'transparent', borderWidth: 0, height: 44, fontSize: 14, color: theme.textPrimary },
  filtersWrapper: { paddingLeft: 16, marginTop: 4 },
  filtersContainer: { paddingRight: 24, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 6 },
  filterChipActive: { backgroundColor: theme.gold, borderColor: theme.gold },
  filterChipMissingActive: { backgroundColor: theme.danger, borderColor: theme.danger },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  filterTextActive: { color: theme.primary, fontWeight: '800' },
  contentContainer: { flex: 1, backgroundColor: '#0B1120' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 80 },

  // Card Normal
  card: { backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  cardMainRow: { flexDirection: 'row', marginBottom: 12 },
  avatarContainer: { marginRight: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212, 175, 55, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  avatarText: { fontSize: 20, fontWeight: '800', color: theme.gold },
  cardContent: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  clientName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, flexShrink: 1 },
  contactContainer: { marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactText: { fontSize: 13, color: theme.textSecondary, marginLeft: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeInfo: { backgroundColor: 'rgba(255,255,255,0.1)' },
  badgeSuccess: { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextInfo: { color: theme.textSecondary },
  badgeTextSuccess: { color: theme.gold },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLabel: { fontSize: 11, color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  footerValuePrimary: { fontSize: 14, fontWeight: '800', color: theme.success },

  // Card Sumidos Específico
  missingInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  missingDaysText: { color: theme.danger, fontSize: 13, fontWeight: '700' },
  lastServiceText: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  missingCardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 4 },
  recoveryButton: { backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 8 },
  recoveryButtonText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Estilos do Modal de Recuperação
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.cardBg, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },
  modalDescription: { fontSize: 13, color: theme.textSecondary, marginBottom: 20 },
  messageInput: { backgroundColor: 'rgba(0,0,0,0.2)', color: theme.textPrimary, borderRadius: 12, padding: 16, fontSize: 15, height: 150, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24 },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.textSecondary },
  modalCancelText: { color: theme.textSecondary, fontWeight: '700', fontSize: 14 },
  modalSendButton: { flex: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#25D366', gap: 8 },
  modalSendText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});