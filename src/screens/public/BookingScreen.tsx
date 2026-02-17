import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { serviceService } from '../../services/services';
import { professionalService } from '../../services/professionals';
import { appointmentService } from '../../services/appointments';

import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Calendar } from '../../components/calendar/Calendar';
import { TimeSlot as TimeSlotComponent } from '../../components/calendar/TimeSlot';

import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';

interface RouteParams {
  companyId: string;
  serviceId?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  onlineBooking?: boolean;
}

interface Professional {
  id: string;
  name: string;
  specialty?: string;
  avatar?: string;
}

interface Slot {
  time: string;
  available: boolean;
}

interface BookingForm {
  serviceId: string;
  professionalId: string;
  date: Date;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
}

export function BookingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { companyId, serviceId: initialServiceId } = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1);

  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [timeSlots, setTimeSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [form, setForm] = useState<BookingForm>({
    serviceId: initialServiceId || '',
    professionalId: '',
    date: new Date(),
    time: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingForm, string>>>({});

  useEffect(() => {
    loadData();
  }, [companyId]);

  useEffect(() => {
    if (form.serviceId && form.professionalId) {
      loadTimeSlots();
    }
  }, [form.serviceId, form.professionalId, selectedDate]);

  const loadData = async () => {
  try {
    setLoading(true);

    const servicesData: Service[] = await serviceService.list();
    const professionalsData: Professional[] = await professionalService.list();

    // Aqui resolvemos o erro de 's' implicit any
    setServices(servicesData.filter((s: Service) => s.onlineBooking));
    setProfessionals(professionalsData);

    if (initialServiceId) {
      setForm(prev => ({ ...prev, serviceId: initialServiceId }));
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Erro', 'Não foi possível carregar dados');
  } finally {
    setLoading(false);
  }
};


  /** CARREGAR HORÁRIOS DISPONÍVEIS (MOCKADO) */
  const loadTimeSlots = async () => {
    try {
      // Mock: substitua por appointmentService.getAvailableSlots quando backend estiver pronto
      setTimeSlots([
        { time: '09:00', available: true },
        { time: '10:00', available: true },
        { time: '11:00', available: false },
      ]);
    } catch (error) {
      console.error(error);
      setTimeSlots([]);
    }
  };

  /** VALIDAÇÕES */
  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof BookingForm, string>> = {};
    if (!form.serviceId) newErrors.serviceId = 'Selecione um serviço';
    if (!form.professionalId) newErrors.professionalId = 'Selecione um profissional';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof BookingForm, string>> = {};
    if (!form.date) newErrors.date = 'Selecione uma data';
    if (!form.time) newErrors.time = 'Selecione um horário';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Partial<Record<keyof BookingForm, string>> = {};
    if (!form.clientName.trim()) newErrors.clientName = 'Nome obrigatório';
    if (!form.clientEmail.trim()) newErrors.clientEmail = 'E-mail obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.clientEmail)) newErrors.clientEmail = 'E-mail inválido';
    if (!form.clientPhone.trim()) newErrors.clientPhone = 'Telefone obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** NAVEGAÇÃO ENTRE STEPS */
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  /** ENVIO DE AGENDAMENTO */
  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setBooking(true);
    try {
      await appointmentService.createPublic({
        serviceId: form.serviceId,
        professionalId: form.professionalId,
        date: form.date.toISOString().split('T')[0],
        time: form.time,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        notes: form.notes,
      });

      Alert.alert('Sucesso', 'Agendamento realizado', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', error?.response?.data?.message || 'Não foi possível agendar');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getSelectedService = () => services.find(s => s.id === form.serviceId);
  const getSelectedProfessional = () => professionals.find(p => p.id === form.professionalId);

  /** RENDER STEPS */
  const renderStep1 = () => (
    <View style={{ gap: 24 }}>
      <Text style={commonStyles.h3}>Selecione o Serviço</Text>
      {services.map(service => (
        <TouchableOpacity
          key={service.id}
          style={[
            commonStyles.card,
            form.serviceId === service.id && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => {
            setForm(prev => ({ ...prev, serviceId: service.id }));
            setErrors(prev => ({ ...prev, serviceId: undefined }));
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={commonStyles.h3}>{service.name}</Text>
            <Text style={[commonStyles.h3, { color: colors.primary }]}>{service.duration} min</Text>
          </View>
          {service.description && (
            <Text style={[commonStyles.body, { color: colors.textSecondary }]}>{service.description}</Text>
          )}
        </TouchableOpacity>
      ))}
      {errors.serviceId && <Text style={{ color: colors.error }}>{errors.serviceId}</Text>}

      <Text style={[commonStyles.h3, { marginTop: 16 }]}>Selecione o Profissional</Text>
      {professionals.map(prof => (
        <TouchableOpacity
          key={prof.id}
          style={[
            commonStyles.card,
            form.professionalId === prof.id && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => {
            setForm(prev => ({ ...prev, professionalId: prof.id }));
            setErrors(prev => ({ ...prev, professionalId: undefined }));
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {prof.avatar ? (
              <Image source={{ uri: prof.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.primary }}>{prof.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={commonStyles.body}>{prof.name}</Text>
          </View>
        </TouchableOpacity>
      ))}
      {errors.professionalId && <Text style={{ color: colors.error }}>{errors.professionalId}</Text>}

      <Button title="Continuar" onPress={nextStep} />
    </View>
  );

  const renderStep2 = () => (
    <View style={{ gap: 24 }}>
      <Text style={commonStyles.h3}>Selecione a Data</Text>
      <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      {errors.date && <Text style={{ color: colors.error }}>{errors.date}</Text>}

      <Text style={[commonStyles.h3, { marginTop: 16 }]}>Horários Disponíveis</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {timeSlots.map(slot => (
          <TimeSlotComponent
            key={slot.time}
            time={slot.time}
            available={slot.available}
            selected={form.time === slot.time}
            onPress={() => {
              setForm(prev => ({ ...prev, time: slot.time }));
              setErrors(prev => ({ ...prev, time: undefined }));
            }}
          />
        ))}
      </View>
      {errors.time && <Text style={{ color: colors.error }}>{errors.time}</Text>}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Button title="Voltar" onPress={prevStep} variant="outline" />
        <Button title="Continuar" onPress={nextStep} />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ gap: 24 }}>
      <Card>
        <Text style={commonStyles.h3}>Resumo do Agendamento</Text>
        <View style={{ marginTop: 8 }}>
          <Text>Serviço: {getSelectedService()?.name}</Text>
          <Text>Profissional: {getSelectedProfessional()?.name}</Text>
          <Text>Data: {form.date.toLocaleDateString('pt-BR')} às {form.time}</Text>
        </View>
      </Card>

      <Input
        label="Nome"
        value={form.clientName}
        onChangeText={v => setForm(prev => ({ ...prev, clientName: v }))}
        error={errors.clientName}
      />
      <Input
        label="Email"
        value={form.clientEmail}
        onChangeText={v => setForm(prev => ({ ...prev, clientEmail: v }))}
        error={errors.clientEmail}
      />
      <Input
        label="Telefone"
        value={form.clientPhone}
        onChangeText={v => setForm(prev => ({ ...prev, clientPhone: v }))}
        error={errors.clientPhone}
      />
      <Input
        label="Observações (opcional)"
        value={form.notes || ''}
        onChangeText={v => setForm(prev => ({ ...prev, notes: v }))}
      />

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Button title="Voltar" onPress={prevStep} variant="outline" />
        <Button
          title={booking ? 'Confirmando...' : 'Confirmar'}
          onPress={handleSubmit}
          loading={booking}
          disabled={booking}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={commonStyles.h1}>Agendamento</Text>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </ScrollView>
  );
}
