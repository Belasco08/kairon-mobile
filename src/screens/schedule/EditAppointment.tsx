import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; // Padronizando para Feather
import { appointmentService } from '../../services/appointments';
import { serviceService } from '../../services/services';
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
  border: 'rgba(255, 255, 255, 0.05)',
};

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category?: string;
}

interface AppointmentService {
  serviceId: string;
  service: Service;
}

interface Appointment {
  id: string;
  totalPrice: number;
  appointmentServices: AppointmentService[];
}

export function EditAppointment() {
  const route = useRoute();
  const navigation = useNavigation();
  const { appointmentId } = route.params as { appointmentId: string };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [originalTotal, setOriginalTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentRes, servicesRes] = await Promise.all([
        appointmentService.get(appointmentId),
        serviceService.list(),
      ]);

      // 👇 CORREÇÃO DO ERRO 'undefined': Tenta ler o formato aninhado, o flat, ou devolve array vazio
      const rawServicesList = appointmentRes.appointmentServices || appointmentRes.services || [];

      // Mapeando para garantir serviceId, suportando as duas formas de API
      const mappedAppointment: Appointment = {
        ...appointmentRes,
        appointmentServices: rawServicesList.map((item: any) => ({
          serviceId: item.service?.id || item.id,
          service: item.service || item,
        })),
      };

      setAppointment(mappedAppointment);
      setAvailableServices(servicesRes.filter((s: any) => s.isActive || s.active));

      const initialSelected = mappedAppointment.appointmentServices.map(
        (as) => as.serviceId
      );
      setSelectedServices(initialSelected);
      setOriginalTotal(mappedAppointment.totalPrice);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = availableServices.find((s) => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const calculateDifference = () => {
    const newTotal = calculateTotal();
    return newTotal - originalTotal;
  };

  const getServiceCount = (serviceId: string) => {
    return selectedServices.filter((id) => id === serviceId).length;
  };

  const handleSave = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um serviço');
      return;
    }

    setSaving(true);
    try {
      await appointmentService.updateServices(appointmentId, selectedServices);

      Alert.alert('Sucesso!', 'Agendamento atualizado com sucesso', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  const total = calculateTotal();
  const difference = calculateDifference();

  const servicesByCategory = availableServices.reduce((acc, service) => {
    const category = service.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Editar Serviços</Text>
            <Text style={styles.headerSubtitle}>Ajuste os serviços realizados</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* LISTA DE SERVIÇOS */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.sectionMainTitle}>Serviços Disponíveis</Text>

          {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
            <View key={category} style={{ marginBottom: 20 }}>
              <Text style={styles.categoryTitle}>{category}</Text>

              <View style={{ gap: 10 }}>
                {categoryServices.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  const count = getServiceCount(service.id);

                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                      onPress={() => toggleService(service.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.serviceRow}>
                        
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.serviceName, isSelected && { color: theme.gold }]}>
                            {service.name}
                          </Text>
                          <Text style={styles.serviceDuration}>
                            {service.duration} minutos
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={[styles.servicePrice, isSelected && { color: theme.gold }]}>
                            {formatCurrency(service.price)}
                          </Text>

                          {/* CONTROLES DE QUANTIDADE (Aparecem se o item estiver selecionado e houver mais de 1) */}
                          {isSelected && count > 1 && (
                            <View style={styles.quantityControl}>
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  const newSelected = [...selectedServices];
                                  const index = newSelected.lastIndexOf(service.id);
                                  if (index > -1) newSelected.splice(index, 1);
                                  setSelectedServices(newSelected);
                                }}
                                style={{ padding: 4 }}
                              >
                                <Feather name="minus-circle" size={20} color={theme.danger} />
                              </TouchableOpacity>

                              <Text style={styles.quantityText}>{count}x</Text>

                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setSelectedServices([...selectedServices, service.id]);
                                }}
                                style={{ padding: 4 }}
                              >
                                <Feather name="plus-circle" size={20} color={theme.gold} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* RESUMO FINANCEIRO */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo Financeiro</Text>

          <View style={{ gap: 12 }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valor Original:</Text>
              <Text style={styles.summaryValueLight}>{formatCurrency(originalTotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Novo Valor:</Text>
              <Text style={styles.summaryValueStrong}>{formatCurrency(total)}</Text>
            </View>

            <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.summaryLabel}>Diferença:</Text>
              <Text
                style={[
                  styles.summaryValueDiff,
                  difference > 0
                    ? { color: theme.success }
                    : difference < 0
                    ? { color: theme.danger }
                    : { color: theme.textSecondary },
                ]}
              >
                {difference > 0 ? '+' : ''}
                {formatCurrency(difference)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER BUTTON */}
      <View style={styles.footer}>
        <Button
          title={saving ? "Salvando..." : "Salvar Alterações"}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={{ backgroundColor: theme.gold }}
          textStyle={{ color: theme.primary, fontWeight: '900' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.goldLight,
    marginTop: 2,
  },
  
  sectionMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  serviceCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  serviceCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: theme.gold,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
  },

  summaryCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.gold,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  summaryValueLight: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  summaryValueStrong: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '800',
  },
  summaryValueDiff: {
    fontSize: 16,
    fontWeight: '900',
  },

  footer: {
    padding: 20,
    backgroundColor: theme.cardBg,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
});