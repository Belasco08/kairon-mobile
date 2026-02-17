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
  ScrollView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { clientService } from '../../services/clients'; 
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/shared/EmptyState';

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM (Azul Marinho e Dourado)
// ==============================================================================
const theme = {
  primary: '#0F172A',      // Azul Marinho Profundo
  cardBg: '#1E293B',       // Azul Claro para os cartões
  gold: '#D4AF37',         // Dourado Kairon
  goldLight: '#FDE68A',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  success: '#10B981',
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

type SortOption = 'name' | 'spent' | 'visits';

export function ClientList() {
  const navigation = useNavigation<any>();
  // 🔴 CORREÇÃO 1 e 2: Removido 'company' e usado apenas 'user'
  const { user } = useAuth(); 

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState<string>('');
  
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const loadClients = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // 🔴 CORREÇÃO 3: Removido o 'companyId' do payload. 
      // O backend pega a empresa pelo Token JWT!
      const response = await clientService.list({}); 
      
      setClients(response);
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
    }, []) 
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const processedClients = useMemo(() => {
    let result = clients.filter(client =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(search.toLowerCase())) ||
      (client.phone && client.phone.includes(search))
    );

    return result.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name); 
        } else if (sortBy === 'spent') {
            return b.totalSpent - a.totalSpent; 
        } else if (sortBy === 'visits') {
            return b.totalAppointments - a.totalAppointments; 
        }
        return 0;
    });
  }, [clients, search, sortBy]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ClientDetails', { clientId: item.id })}
    >
      <View style={styles.cardMainRow}>
        <View style={styles.avatarContainer}>
           <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
           </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
            
            {item.totalAppointments > 0 && (
                <View style={[
                    styles.badge, 
                    item.totalAppointments > 5 ? styles.badgeSuccess : styles.badgeInfo
                ]}>
                    <Text style={[
                        styles.badgeText,
                        item.totalAppointments > 5 ? styles.badgeTextSuccess : styles.badgeTextInfo
                    ]}>
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
            <Text style={[
                styles.footerValuePrimary,
                sortBy === 'spent' && { color: theme.gold, fontSize: 16 }
            ]}>
                {formatCurrency(item.totalSpent)}
            </Text>
         </View>
      </View>
    </TouchableOpacity>
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
                    {loading ? "Carregando..." : `${processedClients.length} encontrados`}
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
            <FlatList
              data={processedClients}
              keyExtractor={(item) => item.id}
              renderItem={renderClient}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  // 🔴 CORREÇÃO 4: Ícone 'people' compatível com MaterialIcons
                  icon="people"
                  title="Nenhum cliente"
                  description="Use o botão Novo para cadastrar."
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
  
  // Header
  headerContainer: {
    backgroundColor: theme.primary,
    paddingTop: 16,
    paddingBottom: 12, 
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    zIndex: 10
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.goldLight,
  },
  addButton: {
    backgroundColor: theme.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: theme.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: theme.primary,
    fontWeight: '800',
    fontSize: 14
  },

  // Busca
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginHorizontal: 16,
    marginBottom: 12
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 44,
    fontSize: 14,
    color: theme.textPrimary
  },

  // FILTROS (CHIPS)
  filtersWrapper: {
      paddingLeft: 16, 
      marginTop: 4
  },
  filtersContainer: {
      paddingRight: 24, 
      gap: 8
  },
  filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      gap: 6
  },
  filterChipActive: {
      backgroundColor: theme.gold,
      borderColor: theme.gold
  },
  filterText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary
  },
  filterTextActive: {
      color: theme.primary,
      fontWeight: '800'
  },

  // Conteúdo
  contentContainer: {
    flex: 1,
    backgroundColor: '#0B1120', // Um tom levemente mais escuro para o fundo da lista destacar os cards
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },

  // Cards
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  cardMainRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.gold,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    flexShrink: 1
  },
  contactContainer: {
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginLeft: 6,
  },
  
  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeInfo: { backgroundColor: 'rgba(255,255,255,0.1)' },
  badgeSuccess: { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextInfo: { color: theme.textSecondary },
  badgeTextSuccess: { color: theme.gold },
  
  // Footer do Card
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
    marginTop: 4,
  },
  footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
  },
  footerLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footerValuePrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.success, 
  },
});