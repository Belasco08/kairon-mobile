import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
  Image,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather, MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { professionalService } from '../../services/professionals';
import { Input } from '../../components/ui/Input'; 
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

// ==============================================================================
// ⚠️ SUBSTITUA PELO SEU IP (O MESMO DO PERFIL E DA EMPRESA)
// ==============================================================================
const API_URL = "http://192.168.1.8:8080"; 

interface Professional {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  photoUrl?: string;
  avatar?: string;
  isActive?: boolean; 
  active?: boolean;
  services?: Array<{ id: string; name: string }>;
  // 👇 CAMPOS FINANCEIROS (COMISSÃO)
  totalAppointments?: number;
  pendingCommission?: number;
  commissionPercentage?: number;
}

type RootStackParamList = {
  ProfessionalList: undefined;
  CreateProfessional: undefined;
  EditProfessional: { professionalId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfessionalList'>;

export function ProfessionalList() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false); 
  const [search, setSearch] = useState(''); // 👇 ESTADO DA BUSCA

  // 👇 USO DO FOCUS EFFECT PARA ATUALIZAR AO ABRIR A TELA 👇
  useFocusEffect(
    useCallback(() => {
      loadProfessionals();
    }, [])
  );

  // --- HELPER PARA CORRIGIR URL DA FOTO ---
  const getAvatarUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return { uri: path };

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    let cleanPath = path.startsWith('/') ? path : `/${path}`;
    return { uri: `${baseUrl}${cleanPath}?t=${new Date().getDate()}` }; 
  };

  const loadProfessionals = async () => {
    try {
      if (!refreshing && professionals.length === 0) setLoading(true);
      const response = await professionalService.list() as any; 
      const data = Array.isArray(response) ? response : (response.content || []);
      setProfessionals(data);
    } catch (error) {
      console.error('Error loading professionals:', error);
      Alert.alert('Erro', 'Não foi possível carregar os profissionais');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfessionals();
  };

  const isProfessionalActive = (p: Professional) => {
    return p.isActive !== undefined ? p.isActive : p.active;
  };

  // 👇 FUNÇÃO DE ACERTO DE COMISSÃO 👇
  const handlePayCommissions = (prof: Professional) => {
    Alert.alert(
      "Acerto de Comissões 💰",
      `Deseja confirmar o pagamento de ${formatCurrency(prof.pendingCommission || 0)} para ${prof.name.split(' ')[0]} e zerar o saldo pendente?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar Acerto", 
          onPress: async () => {
            try {
              await professionalService.payCommission(prof.id);
              Alert.alert("Sucesso!", "Comissão zerada e registrada no caixa.");
              loadProfessionals(); // Recarrega para zerar na tela
            } catch (error) {
              Alert.alert("Erro", "Não foi possível registrar o pagamento.");
            }
          } 
        }
      ]
    );
  };

  const toggleActiveStatus = async (professionalId: string, currentValue: boolean | undefined) => {
    try {
      const newValue = !currentValue;
      await professionalService.update(professionalId, { isActive: newValue });
      setProfessionals(prev =>
        prev.map(p =>
          p.id === professionalId ? { ...p, isActive: newValue, active: newValue } : p
        )
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const handleDelete = (professionalId: string) => {
    Alert.alert(
      'Remover Profissional',
      'Tem certeza? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await professionalService.delete(professionalId);
              setProfessionals(prev => prev.filter(p => p.id !== professionalId));
            } catch {
              Alert.alert('Erro', 'Não foi possível remover');
            }
          },
        },
      ]
    );
  };

  // Aplica filtro de ativos e barra de busca
  const displayedProfessionals = useMemo(() => {
    return professionals.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesActive = showOnlyActive ? isProfessionalActive(p) === true : true;
      return matchesSearch && matchesActive;
    }).sort((a, b) => (b.pendingCommission || 0) - (a.pendingCommission || 0)); // Maior comissão no topo
  }, [professionals, search, showOnlyActive]);

  const canManage = user?.role === 'OWNER' || user?.role === 'STAFF';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const renderProfessional = ({ item }: { item: Professional }) => {
    const active = isProfessionalActive(item);
    const rawPath = item.photoUrl || item.avatar;
    const avatarSource = getAvatarUrl(rawPath);
    const hasCommission = (item.pendingCommission || 0) > 0;

    return (
      <View style={[styles.card, !active && styles.cardInactive]}>
        
        {/* CABEÇALHO DO CARD (Sua estrutura original adaptada) */}
        <TouchableOpacity 
           style={styles.cardHeader}
           activeOpacity={0.7}
           onPress={() => {
               if (canManage) navigation.navigate('EditProfessional', { professionalId: item.id });
           }}
        >
          <View style={styles.avatarContainer}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                 <Feather name="user" size={24} color={theme.gold} />
              </View>
            )}
          </View>

          <View style={styles.cardContent}>
            <View style={styles.rowBetween}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {!active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Inativo</Text>
                  </View>
              )}
            </View>

            <Text style={styles.specialty}>
               {item.specialty || "Profissional Geral"} {item.commissionPercentage ? `• ${item.commissionPercentage}%` : ''}
            </Text>

            <View style={styles.contactRow}>
               {item.phone && (
                   <View style={styles.contactItem}>
                      <Feather name="phone" size={12} color={theme.textSecondary} />
                      <Text style={styles.contactText}>{item.phone}</Text>
                   </View>
               )}
            </View>
          </View>

          {canManage && (
              <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                      <Feather name="trash-2" size={18} color={theme.danger} />
                  </TouchableOpacity>
                  <View style={styles.switchContainer}>
                      <Switch
                          value={!!active}
                          onValueChange={() => toggleActiveStatus(item.id, active)}
                          trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
                          thumbColor={!!active ? theme.primary : '#94A3B8'}
                          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                  </View>
              </View>
          )}
        </TouchableOpacity>

        {/* 👇 MOTOR FINANCEIRO (Estatísticas e Botão) 👇 */}
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={styles.statLabel}>Serviços (Mês)</Text>
              <Text style={styles.statValue}>{item.totalAppointments || 0}</Text>
           </View>
           <View style={styles.statBoxDivider} />
           <View style={styles.statBox}>
              <Text style={styles.statLabel}>A Receber</Text>
              <Text style={[styles.statValue, { color: hasCommission ? theme.success : theme.textPrimary }]}>
                 {formatCurrency(item.pendingCommission || 0)}
              </Text>
           </View>
        </View>

        {canManage && (
            <TouchableOpacity 
               style={[styles.payButton, !hasCommission && styles.payButtonDisabled]}
               disabled={!hasCommission}
               onPress={() => handlePayCommissions(item)}
            >
               <MaterialIcons name="payments" size={18} color={hasCommission ? theme.primary : theme.textSecondary} />
               <Text style={[styles.payButtonText, !hasCommission && styles.payButtonTextDisabled]}>
                  {hasCommission ? "REALIZAR ACERTO" : "NADA PENDENTE"}
               </Text>
            </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* HEADER FIXO E BUSCA */}
      <View style={styles.headerContainer}>
         <View style={styles.headerTop}>
             <View>
                 <Text style={styles.headerTitle}>Equipe</Text>
                 <Text style={styles.headerSubtitle}>{professionals.length} membros cadastrados</Text>
             </View>
             
             {canManage && (
                 <TouchableOpacity 
                     style={styles.btnNew}
                     onPress={() => navigation.navigate('CreateProfessional')}
                 >
                     <Feather name="plus" size={20} color={theme.primary} />
                     <Text style={styles.btnNewText}>Novo</Text>
                 </TouchableOpacity>
             )}
         </View>

         <View style={styles.searchContainer}>
             <Feather name="search" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
             <Input
                placeholder="Buscar barbeiro..."
                placeholderTextColor={theme.textSecondary}
                value={search}
                onChangeText={setSearch}
                containerStyle={{ marginBottom: 0, flex: 1, borderWidth: 0 }} 
                style={{ backgroundColor: 'transparent', height: 44, color: theme.textPrimary }}
             />
         </View>

         <View style={styles.filterRow}>
            <TouchableOpacity 
              style={styles.filterContainer} 
              activeOpacity={0.8}
              onPress={() => setShowOnlyActive(!showOnlyActive)}
            >
                <Text style={styles.filterText}>Ocultar inativos</Text>
                <Switch
                  value={showOnlyActive}
                  onValueChange={setShowOnlyActive}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                />
            </TouchableOpacity>
         </View>
      </View>

      <View style={styles.contentWrapper}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.gold} />
            </View>
          ) : (
            <FlatList
              data={displayedProfessionals}
              keyExtractor={item => item.id}
              renderItem={renderProfessional}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  title="Nenhum profissional"
                  description="Nenhum membro da equipe encontrado."
                  actionText="Adicionar Profissional"
                  onAction={() => navigation.navigate('CreateProfessional')}
                />
              }
            />
          )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // Header e Busca
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.goldLight,
    marginTop: 2,
  },
  btnNew: { 
    backgroundColor: theme.gold, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 8, 
    gap: 6 
  },
  btnNewText: { 
    color: theme.primary, 
    fontWeight: '800', 
    fontSize: 14 
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.cardBg, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 12
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginRight: 8,
    fontWeight: '600'
  },
  
  // Cards Principais
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', 
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    flexShrink: 1,
  },
  specialty: {
    fontSize: 13,
    color: theme.goldLight,
    marginBottom: 8,
    fontWeight: '500'
  },
  contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  contactText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginLeft: 6,
      fontWeight: '600'
  },
  cardActions: {
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingLeft: 10,
  },
  deleteButton: {
      padding: 4,
      marginBottom: 8,
  },
  switchContainer: {
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },

  // Motor Financeiro
  statsRow: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  statBox: { flex: 1, alignItems: 'center' },
  statBoxDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 },
  statLabel: { fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },
  
  payButton: { backgroundColor: theme.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  payButtonDisabled: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
  payButtonText: { color: theme.primary, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  payButtonTextDisabled: { color: theme.textSecondary }
});