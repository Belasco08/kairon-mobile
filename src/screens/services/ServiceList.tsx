import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons'; 

import { useAuth } from '../../contexts/AuthContext';
import { serviceService } from '../../services/services';
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

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  isActive?: boolean; 
  active?: boolean;
  onlineBooking: boolean;
  professionalId?: string; 
  professionalName?: string;
}

type RootStackParamList = {
  ServiceList: undefined;
  CreateService: undefined;
  EditService: { serviceId: string };
};

type ServiceListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceList'>;

export function ServiceList() {
  const navigation = useNavigation<ServiceListNavigationProp>();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false); 

  useEffect(() => {
    loadServices();
  }, []); 

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await serviceService.list() as any;
      const data = Array.isArray(response) ? response : (response.content || []);
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Erro', 'Não foi possível carregar os serviços');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const isServiceActive = (service: Service) => {
    return service.isActive !== undefined ? service.isActive : service.active;
  };

  const toggleActiveStatus = async (serviceId: string, currentStatus: boolean | undefined) => {
    try {
      const newValue = !currentStatus;
      await serviceService.update(serviceId, { isActive: newValue } as any);
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, isActive: newValue, active: newValue } : s
      ));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const filteredServices = services.filter(service => {
    if (showOnlyActive) {
      return isServiceActive(service) === true;
    }
    return true;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // --- RENDERIZAÇÃO DO CARD ---
  const renderService = ({ item }: { item: Service }) => {
    const active = isServiceActive(item);

    return (
      <TouchableOpacity
        style={[styles.card, !active && styles.cardInactive]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('EditService', { serviceId: item.id })}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
            {!active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>Inativo</Text>
              </View>
            )}
          </View>

          {item.description ? (
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <Text style={styles.metaText}>{item.duration} min</Text>
            </View>

            {item.category && (
              <View style={styles.metaItem}>
                <Feather name="tag" size={14} color={theme.textSecondary} />
                <Text style={styles.metaText}>{item.category}</Text>
              </View>
            )}
            
            {item.professionalName && (
               <View style={styles.metaItem}>
                <Feather name="user" size={14} color={theme.textSecondary} />
                <Text style={styles.metaText}>{item.professionalName}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardActions}>
          <Text style={styles.servicePrice}>{formatCurrency(item.price)}</Text>
          
          <View style={styles.switchContainer}>
            <Switch
              value={!!active}
              onValueChange={() => toggleActiveStatus(item.id, active)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Serviços</Text>
          <Text style={styles.headerSubtitle}>{filteredServices.length} cadastrados</Text>
        </View>
        
        <TouchableOpacity 
            style={styles.btnNew}
            onPress={() => navigation.navigate('CreateService')}
        >
            <Feather name="plus" size={20} color={theme.primary} />
            <Text style={styles.btnNewText}>Novo</Text>
        </TouchableOpacity>
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
              // CORREÇÃO: O atributo 'size' foi removido aqui.
            />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum serviço"
            description="Cadastre seus serviços para começar a agendar."
            actionText="Adicionar Serviço"
            onAction={() => navigation.navigate('CreateService')}
          />
        }
      />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
  listContent: {
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  
  // Header
  headerContainer: {
    paddingVertical: 20,
    marginBottom: 8,
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
    marginTop: 4,
  },
  
  // Botão "Novo" Customizado
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

  // Card Styles
  card: {
    flexDirection: 'row',
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: theme.border,
  },
  
  // Conteúdo Interno do Card
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginRight: 8,
    flexShrink: 1,
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  serviceDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  
  // Metadados
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 6,
    fontWeight: '600',
  },

  // Coluna da Direita
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.gold,
  },
  switchContainer: {
    marginTop: 8,
  },
});