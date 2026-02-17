import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { companyService } from '../../services/company';
import { serviceService } from '../../services/services';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/shared/EmptyState';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';

// -----------------------------
// Tipagem da navegação
// -----------------------------
type RootStackParamList = {
  CompanyPublic: { companyId: string };
  BookingScreen: { companyId: string; serviceId: string };
};

type CompanyPublicNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CompanyPublic'
>;

type CompanyPublicRouteProp = RouteProp<RootStackParamList, 'CompanyPublic'>;

// -----------------------------
// Tipagem local
// -----------------------------
interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  onlineBooking: boolean;
}

interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  businessHours?: Record<string, { open: string; close: string }>;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

export function CompanyPublic() {
  const navigation = useNavigation<CompanyPublicNavigationProp>();
  const route = useRoute<CompanyPublicRouteProp>();
  const { companyId } = route.params;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'info' | 'contact'>('services');

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const [companyData, servicesData] = await Promise.all([
        companyService.getPublic(companyId),
        serviceService.getPublic(companyId),
      ]);

      setCompany(companyData);
      setServices(servicesData.filter((s: Service) => s.onlineBooking));
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatBusinessHours = () => {
    if (!company?.businessHours) return [];

    const days = [
      { key: 'monday', label: 'Segunda-feira' },
      { key: 'tuesday', label: 'Terça-feira' },
      { key: 'wednesday', label: 'Quarta-feira' },
      { key: 'thursday', label: 'Quinta-feira' },
      { key: 'friday', label: 'Sexta-feira' },
      { key: 'saturday', label: 'Sábado' },
      { key: 'sunday', label: 'Domingo' },
    ];

    return days.map(day => {
      const hours = company.businessHours?.[day.key];
      return {
        day: day.label,
        hours: hours?.open && hours?.close ? `${hours.open} - ${hours.close}` : 'Fechado',
      };
    });
  };

  const handleCall = () => company?.phone && Linking.openURL(`tel:${company.phone}`);
  const handleEmail = () => company?.email && Linking.openURL(`mailto:${company.email}`);
  const handleWebsite = () => {
    if (!company?.website) return;
    const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
    Linking.openURL(url);
  };
  const handleSocialMedia = (platform: 'instagram' | 'facebook' | 'twitter') => {
    const url = company?.socialMedia?.[platform];
    if (url) Linking.openURL(url);
  };

  const renderService = (service: Service) => (
    <TouchableOpacity
      key={service.id}
      style={[commonStyles.card, { marginBottom: 12 }]}
      onPress={() =>
        navigation.navigate('BookingScreen', {
          companyId,
          serviceId: service.id,
        })
      }
    >
      <View style={[commonStyles.rowBetween, { marginBottom: 8 }]}>
        <Text style={[commonStyles.h3, { flex: 1 }]}>{service.name}</Text>
        <Text style={[commonStyles.h3, { color: colors.primary }]}>{formatCurrency(service.price)}</Text>
      </View>

      {service.description && (
        <Text style={[commonStyles.body, { color: colors.textSecondary, marginBottom: 8 }]}>
          {service.description}
        </Text>
      )}

      <View style={[commonStyles.rowBetween]}>
        {service.category && (
          <Badge variant="info" size="small" text={service.category} />
        )}
        <Text style={{ color: colors.textMuted }}>{service.duration} min</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!company) {
    return (
      <View style={commonStyles.container}>
        <EmptyState
          icon="business"
          title="Empresa não encontrada"
          description="Esta empresa não está disponível ou foi removida"
          actionText="Voltar"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, padding: 24 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginLeft: -8, marginBottom: 16 }}
        >
          <Icon name="arrow-back" size={24} color={colors.surface} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          {company.logo ? (
            <Image
              source={{ uri: company.logo }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.surface,
                marginBottom: 16,
                borderWidth: 4,
                borderColor: colors.surface,
              }}
            />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 4,
                borderColor: colors.surface,
              }}
            >
              <Icon name="business" size={48} color={colors.primary} />
            </View>
          )}

          <Text style={{ color: colors.surface, fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
            {company.name}
          </Text>

          {company.description && (
            <Text style={{ color: colors.surface, textAlign: 'center', opacity: 0.8 }}>
              {company.description}
            </Text>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', padding: 16 }}>
        {(['services', 'info', 'contact'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab ? colors.primary : colors.surface,
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={{ color: activeTab === tab ? colors.primary : colors.surface }}>
              {tab === 'services' ? 'Serviços' : tab === 'info' ? 'Informações' : 'Contato'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>
        {activeTab === 'services' && (
          <View>
            <Text style={{ fontSize: 20, marginBottom: 16 }}>Nossos Serviços</Text>
            {services.length > 0 ? (
              <View>
                {services.map(renderService)}
                <Button
                  title="Agendar Agora"
                  onPress={() =>
                    navigation.navigate('BookingScreen', {
                      companyId,
                      serviceId: services[0].id,
                    })
                  }
                  style={{ marginTop: 24 }}
                />
              </View>
            ) : (
              <EmptyState
                icon="style"
                title="Nenhum serviço disponível"
                description="Esta empresa ainda não disponibilizou serviços para agendamento online"
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
