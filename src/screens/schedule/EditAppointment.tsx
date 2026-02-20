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
  Platform,
  Linking
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; 
import DateTimePicker from '@react-native-community/datetimepicker'; // 👈 NOVO IMPORT
import { appointmentService } from '../../services/appointments';
import { serviceService } from '../../services/services';
import { Button } from '../../components/ui/Button';
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  startTime: string; // 👈 Adicionado
  clientPhone?: string; // 👈 Adicionado
  clientName?: string; // 👈 Adicionado
  client?: any; // 👈 Adicionado
  professionalName?: string; // 👈 Adicionado
  professional?: any; // 👈 Adicionado
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

  // 👇 NOVOS ESTADOS PARA O DATE PICKER
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [dateChanged, setDateChanged] = useState(false); // Para saber se precisa mandar msg no Whats

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentRes, servicesRes] = await Promise.all([
        appointmentService.get(appointmentId),
        serviceService.list(),
      ]);

      const rawServicesList = appointmentRes.appointmentServices || appointmentRes.services || [];

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

      // Seta a data inicial do seletor
      if (mappedAppointment.startTime) {
          const parsedDate = parseISO(mappedAppointment.startTime);
          if (isValid(parsedDate)) {
              setSelectedDate(parsedDate);
          }
      }

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

  // 👇 LÓGICA DO DATE PICKER
  const showMode = (currentMode: 'date' | 'time') => {
    setShowDatePicker(true);
    setPickerMode(currentMode);
  };

  const onChangeDate = (event: any, selectedValue?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedValue) {
      setSelectedDate(selectedValue);
      setDateChanged(true);
    }
  };

  // 👇 LÓGICA DO WHATSAPP DE ALTERAÇÃO
  const handleMessageClientChange = async () => {
      if (!appointment) return;
      
      const phone = appointment.clientPhone || appointment.client?.phone;
      if (!phone) {
          Alert.alert("Aviso", "Este cliente não possui telefone cadastrado.");
          return navigation.goBack();
      }

      const clientName = appointment.clientName || appointment.client?.name || "Cliente";
      const profName = appointment.professionalName || appointment.professional?.name || "Profissional";
      
      const dataFmt = format(selectedDate, "dd/MM/yyyy");
      const horaFmt = format(selectedDate, "HH:mm");

      const msg = `Olá *${clientName}*. Informamos que o seu agendamento com ${profName} foi *alterado*. O seu novo horário é no dia ${dataFmt} às ${horaFmt}. Te aguardamos!`;

      const cleanPhone = phone.replace(/\D/g, "");
      const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
      const url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`;
      
      try {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
              await Linking.openURL(url);
          } else {
              Alert.alert("Erro", "WhatsApp não está instalado neste dispositivo.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          navigation.goBack();
      }
  };

  // 👇 SALVAR ALTERAÇÕES
  const handleSave = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um serviço');
      return;
    }

    setSaving(true);
    try {
      const formattedDateForApi = selectedDate.toISOString();

      // 👇 AJUSTADO: Enviando 'serviceIds' em vez de 'services' para bater com o Java
      await appointmentService.update(appointmentId, {
          serviceIds: selectedServices, 
          startTime: formattedDateForApi
      });

      if (dateChanged) {
         Alert.alert(
            "Sucesso!", 
            "Agendamento e Horário atualizados com sucesso.\nDeseja avisar o cliente da alteração de horário?",
            [
               { text: "Não avisar", style: "cancel", onPress: () => navigation.goBack() },
               { text: "Avisar no WhatsApp", onPress: handleMessageClientChange }
            ]
         );
      } else {
         Alert.alert('Sucesso!', 'Agendamento atualizado com sucesso', [
           { text: 'OK', onPress: () => navigation.goBack() },
         ]);
      }

    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao salvar. Verifique se o horário está disponível.');
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
            <Text style={styles.headerTitle}>Editar Agendamento</Text>
            <Text style={styles.headerSubtitle}>Ajuste data, hora ou serviços</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* 👇 NOVO: SEÇÃO DE DATA E HORA 👇 */}
        <View style={{ marginBottom: 30 }}>
           <Text style={styles.sectionMainTitle}>Data e Hora</Text>
           <View style={styles.dateTimeContainer}>
              <TouchableOpacity style={styles.dateTimeButton} onPress={() => showMode('date')} activeOpacity={0.7}>
                 <Feather name="calendar" size={20} color={theme.gold} />
                 <View style={{ marginLeft: 12 }}>
                    <Text style={styles.dateTimeLabel}>Data Selecionada</Text>
                    <Text style={styles.dateTimeValue}>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</Text>
                 </View>
              </TouchableOpacity>

              <View style={styles.verticalDivider} />

              <TouchableOpacity style={styles.dateTimeButton} onPress={() => showMode('time')} activeOpacity={0.7}>
                 <Feather name="clock" size={20} color={theme.gold} />
                 <View style={{ marginLeft: 12 }}>
                    <Text style={styles.dateTimeLabel}>Horário</Text>
                    <Text style={styles.dateTimeValue}>{format(selectedDate, "HH:mm")}</Text>
                 </View>
              </TouchableOpacity>
           </View>
        </View>

        {showDatePicker && (
           <DateTimePicker
             value={selectedDate}
             mode={pickerMode}
             is24Hour={true}
             display="default"
             onChange={onChangeDate}
             themeVariant="dark" // Só funciona no iOS
           />
        )}


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
    marginBottom: 16,
  },

  // 👇 ESTILOS DO DATE PICKER
  dateTimeContainer: {
     flexDirection: 'row',
     backgroundColor: theme.cardBg,
     borderRadius: 16,
     borderWidth: 1,
     borderColor: theme.border,
     overflow: 'hidden'
  },
  dateTimeButton: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     padding: 16,
  },
  verticalDivider: {
     width: 1,
     backgroundColor: theme.border,
  },
  dateTimeLabel: {
     fontSize: 12,
     color: theme.textSecondary,
     fontWeight: '600',
     textTransform: 'uppercase',
  },
  dateTimeValue: {
     fontSize: 15,
     color: theme.textPrimary,
     fontWeight: '700',
     marginTop: 2,
     textTransform: 'capitalize'
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