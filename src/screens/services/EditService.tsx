import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  StyleSheet
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useCompany } from '../../hooks/useCompany';
import { serviceService } from '../../services/services';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

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
  info: '#38BDF8',
  border: 'rgba(255, 255, 255, 0.05)',
};

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  duration: string;
  category: string;
  isActive: boolean;
  onlineBooking: boolean;
  professionalId?: string;
}

interface RouteParams {
  serviceId: string;
}

export function EditService() {
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceId } = route.params as RouteParams;
  const { company } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ServiceForm>({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    isActive: true,
    onlineBooking: true,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceForm, string>>>({});

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    try {
      setLoading(true);
      const service = await serviceService.get(serviceId);
      
      setForm({
        name: service.name || '',
        description: service.description || '',
        // Troca ponto por vírgula para ficar amigável no input brasileiro
        price: service.price ? service.price.toString().replace('.', ',') : '0,00',
        duration: service.duration ? service.duration.toString() : '60',
        category: service.category || '',
        isActive: service.isActive ?? true,
        onlineBooking: service.onlineBooking ?? true,
        professionalId: service.professionalId,
      });
    } catch (error) {
      console.error('Error loading service:', error);
      Alert.alert('Erro', 'Não foi possível carregar o serviço');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ServiceForm, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!form.price) {
      newErrors.price = 'Preço é obrigatório';
    } else if (parseFloat(form.price.replace(',', '.')) <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (!form.duration) {
      newErrors.duration = 'Duração é obrigatória';
    } else if (parseInt(form.duration) <= 0) {
      newErrors.duration = 'Duração deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const serviceData = {
        ...form,
        // Garante que a API receba um float válido
        price: parseFloat(form.price.replace(',', '.')),
        duration: parseInt(form.duration),
        companyId: company?.id,
      };

      await serviceService.update(serviceId, serviceData);
      
      Alert.alert(
        'Sucesso',
        'Serviço atualizado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating service:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível atualizar o serviço'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Serviço',
      'Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await serviceService.delete(serviceId);
              Alert.alert('Sucesso', 'Serviço excluído com sucesso');
              navigation.goBack();
            } catch (error) {
              setLoading(false);
              Alert.alert('Erro', 'Não foi possível excluir o serviço');
            }
          },
        },
      ]
    );
  };

  const updateForm = (field: keyof ServiceForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color={theme.gold} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Serviço</Text>
            <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.title}>{form.name || 'Editar Serviço'}</Text>
            <Text style={styles.subtitle}>
              Atualize as informações do serviço
            </Text>
          </View>

          {/* DADOS DO SERVIÇO */}
          <View style={styles.card}>
            <View style={{ gap: 16 }}>
              <Input
                label="Nome do Serviço *"
                value={form.name}
                onChangeText={(value) => updateForm('name', value)}
                placeholder="Ex: Corte de Cabelo"
                error={errors.name}
              />

              <Input
                label="Descrição"
                value={form.description}
                onChangeText={(value) => updateForm('description', value)}
                placeholder="Descreva o serviço..."
                multiline
                numberOfLines={3}
              />

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Preço (R$) *"
                    value={form.price}
                    onChangeText={(value) => updateForm('price', value)}
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                    error={errors.price}
                  />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Input
                    label="Duração (min) *"
                    value={form.duration}
                    onChangeText={(value) => updateForm('duration', value)}
                    placeholder="60"
                    keyboardType="number-pad"
                    error={errors.duration}
                  />
                </View>
              </View>

              <Input
                label="Categoria"
                value={form.category}
                onChangeText={(value) => updateForm('category', value)}
                placeholder="Ex: Cabelo, Estética, etc."
              />
            </View>
          </View>

          {/* CONFIGURAÇÕES DO SERVIÇO */}
          <View style={styles.card}>
              <View style={styles.switchRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={[styles.iconBox, form.isActive ? { backgroundColor: 'rgba(16, 185, 129, 0.15)' } : { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                          <Feather name="check-circle" size={20} color={form.isActive ? theme.success : theme.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                          <Text style={styles.switchLabel}>Serviço Ativo</Text>
                          <Text style={styles.switchDesc}>
                              {form.isActive ? 'Disponível na lista' : 'Oculto do sistema'}
                          </Text>
                      </View>
                  </View>
                  <Switch
                      value={form.isActive}
                      onValueChange={(value) => updateForm('isActive', value)}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.success }}
                      thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={[styles.iconBox, form.onlineBooking ? { backgroundColor: 'rgba(212, 175, 55, 0.15)' } : { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                          <Feather name="globe" size={20} color={form.onlineBooking ? theme.gold : theme.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                          <Text style={styles.switchLabel}>Agendamento Online</Text>
                          <Text style={styles.switchDesc}>
                              {form.onlineBooking ? 'Visível para os clientes' : 'Apenas manual'}
                          </Text>
                      </View>
                  </View>
                  <Switch
                      value={form.onlineBooking}
                      onValueChange={(value) => updateForm('onlineBooking', value)}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
                      thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                      disabled={!form.isActive}
                  />
              </View>
          </View>

          {/* ESTATÍSTICAS (MOCK) */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.statsTitle}>Estatísticas do Serviço</Text>
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Total de Agendamentos:</Text>
                <Text style={styles.statsValueLight}>0</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Faturamento Total:</Text>
                <Text style={styles.statsValueSuccess}>R$ 0,00</Text>
              </View>
              <View style={[styles.statsRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.statsLabel}>Taxa de Ocupação:</Text>
                <Text style={styles.statsValueLight}>0%</Text>
              </View>
            </View>
          </View>

          {/* BOTÕES DE AÇÃO */}
          <View style={{ marginTop: 32, gap: 12 }}>
            <Button
              title="Salvar Alterações"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
              style={{ backgroundColor: theme.gold }}
              textStyle={{ color: theme.primary, fontWeight: '900' }}
            />
            
            <Button
              title="Excluir Serviço"
              onPress={handleDelete}
              variant="outline"
              style={{ borderColor: theme.danger, backgroundColor: 'transparent' }}
              textStyle={{ color: theme.danger, fontWeight: '700' }}
            />
            
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 15 }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.primary, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    loadingContainer: { flex: 1, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
    
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: theme.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.textPrimary
    },
    backButton: { padding: 4 },
    
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.textPrimary,
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        color: theme.goldLight,
        fontWeight: '500'
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

    // Configurações
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.textPrimary,
        marginBottom: 2
    },
    switchDesc: {
        fontSize: 12,
        color: theme.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 12
    },

    // Estatísticas
    statsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.gold,
        marginBottom: 12,
    },
    statsCard: {
        backgroundColor: 'rgba(212, 175, 55, 0.05)', 
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    statsLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    statsValueLight: {
        fontSize: 16,
        color: theme.textPrimary,
        fontWeight: '800',
    },
    statsValueSuccess: {
        fontSize: 16,
        color: theme.success,
        fontWeight: '900',
    }
});