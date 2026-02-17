import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; // Mantendo padrão Feather do Premium
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointments';
import { serviceService } from '../../services/services';
import { professionalService } from '../../services/professionals';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  isActive?: boolean;
  active?: boolean;
}

interface Professional {
  id: string;
  name: string;
  isActive?: boolean;
  active?: boolean;
}

export function CreateAppointment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const params = route.params as { 
    initialDate?: string; 
    initialTime?: string;
  } || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  
  const [dateStr, setDateStr] = useState(params.initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [timeStr, setTimeStr] = useState(params.initialTime || '09:00');
  
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const servicesRes = await serviceService.list();
      if (Array.isArray(servicesRes)) {
        const activeServices = servicesRes.filter((s: any) => (s.isActive ?? s.active) === true);
        setServices(activeServices);
      }

      const professionalsRes = await professionalService.list();
      let activePros: Professional[] = [];
      if (Array.isArray(professionalsRes)) {
         activePros = professionalsRes.filter((p: any) => (p.isActive ?? p.active) === true);
         setProfessionals(activePros);
      }

      if (user?.role === 'PROFESSIONAL' && activePros.length > 0) {
          setSelectedProfessional(activePros[0]);
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedService) newErrors.service = 'Selecione um serviço';
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) newErrors.date = 'Data inválida (AAAA-MM-DD)';

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeStr)) newErrors.time = 'Hora inválida';

    if (!clientInfo.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!clientInfo.phone.trim()) newErrors.phone = 'Telefone é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAppointment = async () => {
    if (!validate()) return;
    
    // @ts-ignore
    const targetCompanyId = user?.companyId || user?.company?.id;

    if (!targetCompanyId) {
      Alert.alert('Erro', 'Empresa não identificada');
      return;
    }

    try {
      setSaving(true);
      
      const localIsoDateTime = `${dateStr}T${timeStr}:00`;

      await appointmentService.create({
        companyId: targetCompanyId,
        professionalId: selectedProfessional?.id,
        serviceIds: [selectedService!.id],
        startTime: localIsoDateTime, 
        clientName: clientInfo.name,
        clientPhone: clientInfo.phone,
        clientEmail: clientInfo.email
      });

      Alert.alert('Sucesso', 'Agendamento criado!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao criar agendamento';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  };

  const formattedDateHeader = useMemo(() => {
    try {
        const d = parse(dateStr, 'yyyy-MM-dd', new Date());
        return isValid(d) ? format(d, "EEEE, d 'de' MMMM", { locale: ptBR }) : 'Data Inválida';
    } catch { return dateStr; }
  }, [dateStr]);

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
            <Feather name="x" size={24} color={theme.gold} />
          </TouchableOpacity>
          <View>
              <Text style={styles.headerTitle}>Novo Agendamento</Text>
              <Text style={styles.headerSubtitle}>{formattedDateHeader}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* 1. DATA E HORA */}
          <View style={styles.section}>
               <Text style={styles.sectionTitle}>Quando?</Text>
               <View style={styles.rowGap}>
                   <View style={{ flex: 2 }}>
                      <Input 
                          label="Data" 
                          value={dateStr} 
                          onChangeText={setDateStr}
                          placeholder="2026-02-03"
                          error={errors.date}
                      />
                   </View>
                   <View style={{ flex: 1 }}>
                      <Input 
                          label="Hora" 
                          value={timeStr} 
                          onChangeText={setTimeStr} 
                          placeholder="14:00"
                          error={errors.time}
                      />
                   </View>
               </View>
          </View>

          {/* 2. PROFISSIONAL (Owner Only) */}
          {user?.role === 'OWNER' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profissional</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {professionals.map(prof => {
                  const isSelected = selectedProfessional?.id === prof.id;
                  return (
                    <TouchableOpacity
                      key={prof.id}
                      style={[styles.profCard, isSelected && styles.profCardSelected]}
                      onPress={() => setSelectedProfessional(prof)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.profAvatar, isSelected && styles.profAvatarSelected]}>
                        <Text style={[styles.profInitial, isSelected && styles.profInitialSelected]}>
                          {prof.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.profName, isSelected && styles.profNameSelected]}>
                        {prof.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 3. CLIENTE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <View style={{ gap: 16 }}>
              <Input
                label="Nome do Cliente *"
                placeholder="Ex: João Silva"
                value={clientInfo.name}
                onChangeText={t => {
                    setClientInfo({ ...clientInfo, name: t });
                    if (errors.name) setErrors({...errors, name: ''});
                }}
                error={errors.name}
              />
              <Input
                label="Telefone / WhatsApp *"
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                value={clientInfo.phone}
                onChangeText={t => {
                    setClientInfo({ ...clientInfo, phone: t });
                    if (errors.phone) setErrors({...errors, phone: ''});
                }}
                error={errors.phone}
              />
            </View>
          </View>

          {/* 4. SERVIÇO */}
          <View style={[styles.section, { marginBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Serviço</Text>
            <View style={{ gap: 12 }}>
                  {services.map(service => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <TouchableOpacity
                          key={service.id}
                          onPress={() => {
                              setSelectedService(service);
                              if (errors.service) setErrors({...errors, service: ''});
                          }}
                          activeOpacity={0.8}
                          style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                      >
                          <View>
                              <Text style={[styles.serviceName, isSelected && styles.serviceTextSelected]}>
                                {service.name}
                              </Text>
                              <Text style={styles.serviceDuration}>{service.duration} min</Text>
                          </View>
                          <Text style={[styles.servicePrice, isSelected && styles.serviceTextSelected]}>
                              R$ {service.price.toFixed(2)}
                          </Text>
                      </TouchableOpacity>
                    );
                  })}
            </View>
            {errors.service && <Text style={styles.errorText}>{errors.service}</Text>}
          </View>

        </ScrollView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Total a pagar:</Text>
              <Text style={styles.footerTotal}>
                  R$ {selectedService ? selectedService.price.toFixed(2) : '0.00'}
              </Text>
          </View>
          <Button
              title={saving ? "Salvando..." : "Confirmar Agendamento"}
              onPress={handleCreateAppointment}
              loading={saving}
              disabled={saving}
              style={{ backgroundColor: theme.gold }}
              textStyle={{ color: theme.primary, fontWeight: '900' }}
          />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.primary, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: theme.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: theme.primary, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border
  },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  headerSubtitle: { fontSize: 13, color: theme.goldLight, marginTop: 2, textTransform: 'capitalize' },

  section: { marginBottom: 28 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: theme.gold, 
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  rowGap: { flexDirection: 'row', gap: 16 },

  // Profissional Cards
  profCard: {
    alignItems: 'center', 
    paddingVertical: 12,
    paddingHorizontal: 16, 
    borderRadius: 16,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 90
  },
  profCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: theme.gold,
  },
  profAvatar: {
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border
  },
  profAvatarSelected: {
    backgroundColor: theme.gold,
    borderColor: theme.gold
  },
  profInitial: { color: theme.textSecondary, fontWeight: '800', fontSize: 18 },
  profInitialSelected: { color: theme.primary },
  profName: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  profNameSelected: { color: theme.gold },

  // Service Cards
  serviceCard: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1,
    backgroundColor: theme.cardBg,
    borderColor: theme.border
  },
  serviceCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: theme.gold
  },
  serviceName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  serviceDuration: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
  servicePrice: { fontSize: 16, fontWeight: '800', color: theme.textPrimary },
  serviceTextSelected: { color: theme.gold },

  errorText: { color: theme.danger, fontSize: 12, marginTop: 8, fontWeight: '600' },

  // Footer
  footer: {
    padding: 20, 
    backgroundColor: theme.cardBg, 
    borderTopWidth: 1, 
    borderTopColor: theme.border 
  },
  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16
  },
  footerLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  footerTotal: { fontSize: 24, fontWeight: '900', color: theme.gold },
});