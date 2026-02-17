import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
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

export function CreateService() {
  const navigation = useNavigation();
  const { user } = useAuth(); 
  
  // Pegamos o companyId com segurança para evitar erros de tipagem
  // @ts-ignore
  const targetCompanyId = user?.companyId || user?.company?.id;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ServiceForm>({
    name: '',
    description: '',
    price: '',
    duration: '60',
    category: '',
    isActive: true,
    onlineBooking: true,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceForm, string>>>({});

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

    if (!targetCompanyId) {
      Alert.alert('Erro', 'Sua empresa não foi identificada. Faça login novamente.');
      return;
    }

    setLoading(true);
    try {
      const serviceData = {
        ...form,
        price: parseFloat(form.price.replace(',', '.')),
        duration: parseInt(form.duration),
        companyId: targetCompanyId 
      };

      await serviceService.create(serviceData);

      Alert.alert(
        'Sucesso',
        'Serviço criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating service:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível criar o serviço'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof ServiceForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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
            <Text style={styles.headerTitle}>Novo Serviço</Text>
            <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.title}>Criar Serviço</Text>
            <Text style={styles.subtitle}>
              Cadastre um novo serviço para sua empresa
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
                placeholder="Descreva o serviço detalhadamente..."
                multiline
                numberOfLines={3}
              />

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Preço (R$) *"
                    value={form.price}
                    onChangeText={(value) => updateForm('price', value)}
                    placeholder="0.00"
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

          {/* BOTÕES DE AÇÃO */}
          <View style={{ marginTop: 24 }}>
            <Button
              title="Criar Serviço"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
            
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 15 }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>

          {/* DICAS */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.tipsTitle}>Dicas</Text>
            <View style={styles.tipsCard}>
              <View style={styles.tipRow}>
                <Feather name="info" size={18} color={theme.info} style={{ marginTop: 2 }} />
                <Text style={styles.tipText}>
                  Serviços inativos não aparecem para os clientes nem para a sua equipe.
                </Text>
              </View>
              <View style={[styles.tipRow, { marginTop: 12 }]}>
                <Feather name="info" size={18} color={theme.info} style={{ marginTop: 2 }} />
                <Text style={styles.tipText}>
                  Desative "Agendamento Online" se este serviço exige uma avaliação ou orçamento prévio.
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.primary, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    
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

    // Dicas
    tipsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.gold,
        marginBottom: 12,
    },
    tipsCard: {
        backgroundColor: 'rgba(56, 189, 248, 0.05)', // Fundo azul claro bem translúcido
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: theme.textSecondary,
        lineHeight: 20,
    }
});