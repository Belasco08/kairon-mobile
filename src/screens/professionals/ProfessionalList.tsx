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
  Image,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { professionalService } from '../../services/professionals';
import { api } from '../../services/api'; 
import { Button } from '../../components/ui/Button'; 
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

  useEffect(() => {
    loadProfessionals();
  }, []);

  // --- HELPER PARA CORRIGIR URL DA FOTO (PADRÃO KAIRON) ---
  const getAvatarUrl = (path: string | undefined) => {
    if (!path) return null;

    if (path.startsWith('http')) {
      return { uri: path };
    }

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    let cleanPath = path.startsWith('/') ? path : `/${path}`;
    const finalUrl = `${baseUrl}${cleanPath}`;
    
    return { uri: `${finalUrl}?t=${new Date().getDate()}` }; 
  };

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const response = await professionalService.list() as any; // 🔧 CORREÇÃO DO ERRO 'never'
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

  const displayedProfessionals = professionals.filter(p => {
    if (showOnlyActive) {
      return isProfessionalActive(p) === true;
    }
    return true;
  });

  const canManage = user?.role === 'OWNER' || user?.role === 'STAFF';

  const renderProfessional = ({ item }: { item: Professional }) => {
    const active = isProfessionalActive(item);
    
    const rawPath = item.photoUrl || item.avatar;
    const avatarSource = getAvatarUrl(rawPath);

    return (
      <TouchableOpacity
        style={[styles.card, !active && styles.cardInactive]}
        activeOpacity={0.7}
        onPress={() => {
            if (canManage) navigation.navigate('EditProfessional', { professionalId: item.id });
        }}
      >
        <View style={styles.avatarContainer}>
          {avatarSource ? (
            <Image 
              source={avatarSource} 
              style={styles.avatarImage} 
              resizeMode="cover"
            />
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
             {item.specialty || "Profissional Geral"}
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
                <TouchableOpacity 
                    onPress={() => handleDelete(item.id)} 
                    style={styles.deleteButton}
                >
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
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Profissionais</Text>
          <Text style={styles.headerSubtitle}>{displayedProfessionals.length} membros na equipe</Text>
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
        data={displayedProfessionals}
        keyExtractor={item => item.id}
        renderItem={renderProfessional}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum profissional"
            description="Adicione sua equipe para começar os agendamentos."
            actionText="Adicionar Profissional"
            onAction={() => navigation.navigate('CreateProfessional')}
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
  
  // Cards
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
    borderColor: theme.border
  },
  cardInactive: {
    opacity: 0.6,
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
    fontSize: 14,
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
});