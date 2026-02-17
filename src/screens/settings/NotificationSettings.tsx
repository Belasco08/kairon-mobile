import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notifications';
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

interface NotificationSettings {
  emailNotifications: {
    newAppointments: boolean;
    cancellations: boolean;
    reminders: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  pushNotifications: {
    newAppointments: boolean;
    cancellations: boolean;
    reminders: boolean;
    updates: boolean;
  };
  smsNotifications: {
    reminders: boolean;
    confirmations: boolean;
  };
  appointmentReminders: {
    enabled: boolean;
    hoursBefore: number;
    method: 'email' | 'sms' | 'both';
  };
}

export function NotificationSettings() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: {
      newAppointments: true,
      cancellations: true,
      reminders: true,
      promotions: false,
      newsletter: false,
    },
    pushNotifications: {
      newAppointments: true,
      cancellations: true,
      reminders: true,
      updates: true,
    },
    smsNotifications: {
      reminders: true,
      confirmations: true,
    },
    appointmentReminders: {
      enabled: true,
      hoursBefore: 24,
      method: 'both',
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await notificationService.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await notificationService.updateSettings(settings);
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateEmailSetting = (key: keyof NotificationSettings['emailNotifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value,
      },
    }));
  };

  const updatePushSetting = (key: keyof NotificationSettings['pushNotifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        [key]: value,
      },
    }));
  };

  const updateSmsSetting = (key: keyof NotificationSettings['smsNotifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      smsNotifications: {
        ...prev.smsNotifications,
        [key]: value,
      },
    }));
  };

  const updateReminderSetting = (key: keyof NotificationSettings['appointmentReminders'], value: any) => {
    setSettings(prev => ({
      ...prev,
      appointmentReminders: {
        ...prev.appointmentReminders,
        [key]: value,
      },
    }));
  };

  const renderNotificationItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: any // Tipado como 'any' para aceitar os nomes do Feather sem reclamar
  ) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationInfo}>
        <View style={styles.iconBox}>
            <Feather name={icon} size={18} color={theme.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemDesc}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
        thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      />
    </View>
  );

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>Notificações</Text>
            <Text style={styles.headerSubtitle}>Configure como deseja ser avisado</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Email Notifications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="mail" size={20} color={theme.gold} style={{ marginRight: 12 }} />
            <Text style={styles.cardTitle}>Por E-mail</Text>
          </View>

          {renderNotificationItem('Novos Agendamentos', 'Receba e-mail quando um novo agendamento for feito', settings.emailNotifications.newAppointments, (v) => updateEmailSetting('newAppointments', v), 'calendar')}
          {renderNotificationItem('Cancelamentos', 'Receba e-mail quando um agendamento for cancelado', settings.emailNotifications.cancellations, (v) => updateEmailSetting('cancellations', v), 'x-circle')}
          {renderNotificationItem('Lembretes', 'Receba lembretes de agendamentos futuros', settings.emailNotifications.reminders, (v) => updateEmailSetting('reminders', v), 'bell')}
          {renderNotificationItem('Promoções', 'Receba ofertas e promoções especiais', settings.emailNotifications.promotions, (v) => updateEmailSetting('promotions', v), 'tag')}
          {renderNotificationItem('Newsletter', 'Receba novidades e dicas sobre o sistema', settings.emailNotifications.newsletter, (v) => updateEmailSetting('newsletter', v), 'file-text')}
        </View>

        {/* Push Notifications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="smartphone" size={20} color={theme.gold} style={{ marginRight: 12 }} />
            <Text style={styles.cardTitle}>Notificações no App</Text>
          </View>

          {renderNotificationItem('Novos Agendamentos', 'Notificação quando um novo agendamento for feito', settings.pushNotifications.newAppointments, (v) => updatePushSetting('newAppointments', v), 'calendar')}
          {renderNotificationItem('Cancelamentos', 'Notificação quando um agendamento for cancelado', settings.pushNotifications.cancellations, (v) => updatePushSetting('cancellations', v), 'x-circle')}
          {renderNotificationItem('Lembretes', 'Lembretes de agendamentos futuros', settings.pushNotifications.reminders, (v) => updatePushSetting('reminders', v), 'bell')}
          {renderNotificationItem('Atualizações', 'Notificações sobre atualizações do sistema', settings.pushNotifications.updates, (v) => updatePushSetting('updates', v), 'refresh-cw')}
        </View>

        {/* SMS Notifications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="message-square" size={20} color={theme.gold} style={{ marginRight: 12 }} />
            <Text style={styles.cardTitle}>Notificações por SMS</Text>
            <Text style={styles.cardSubtitle}>* Pode haver custos</Text>
          </View>

          {renderNotificationItem('Lembretes', 'Receba lembretes de agendamentos por SMS', settings.smsNotifications.reminders, (v) => updateSmsSetting('reminders', v), 'bell')}
          {renderNotificationItem('Confirmações', 'Receba confirmações de agendamento por SMS', settings.smsNotifications.confirmations, (v) => updateSmsSetting('confirmations', v), 'check-circle')}
        </View>

        {/* Appointment Reminders */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="clock" size={20} color={theme.gold} style={{ marginRight: 12 }} />
            <Text style={styles.cardTitle}>Lembretes para Clientes</Text>
          </View>

          <View style={[styles.notificationItem, { borderBottomWidth: settings.appointmentReminders.enabled ? 1 : 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Lembretes Ativados</Text>
              <Text style={styles.itemDesc}>Enviar lembretes automáticos para os clientes</Text>
            </View>
            <Switch
              value={settings.appointmentReminders.enabled}
              onValueChange={(value) => updateReminderSetting('enabled', value)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            />
          </View>

          {settings.appointmentReminders.enabled && (
            <View style={{ marginTop: 20, gap: 24 }}>
              
              {/* Contador de Horas */}
              <View>
                <Text style={styles.sectionLabel}>Antecedência do Lembrete</Text>
                <View style={styles.counterRow}>
                  <Text style={styles.counterDesc}>
                    {settings.appointmentReminders.hoursBefore} horas antes
                  </Text>
                  
                  <View style={styles.counterControls}>
                    <TouchableOpacity
                      onPress={() => updateReminderSetting('hoursBefore', Math.max(1, settings.appointmentReminders.hoursBefore - 1))}
                      style={styles.counterBtn}
                    >
                      <Feather name="minus" size={18} color={theme.textPrimary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.counterValue}>{settings.appointmentReminders.hoursBefore}h</Text>
                    
                    <TouchableOpacity
                      onPress={() => updateReminderSetting('hoursBefore', settings.appointmentReminders.hoursBefore + 1)}
                      style={styles.counterBtn}
                    >
                      <Feather name="plus" size={18} color={theme.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Segmented Control Method */}
              <View>
                <Text style={styles.sectionLabel}>Método de Envio</Text>
                <View style={styles.segmentedControl}>
                  {(['email', 'sms', 'both'] as const).map((method) => {
                    const isSelected = settings.appointmentReminders.method === method;
                    return (
                        <TouchableOpacity
                            key={method}
                            style={[
                                styles.segmentBtn,
                                isSelected && styles.segmentBtnActive
                            ]}
                            onPress={() => updateReminderSetting('method', method)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.segmentText,
                                isSelected && styles.segmentTextActive
                            ]}>
                                {method === 'email' ? 'E-mail' : method === 'sms' ? 'SMS' : 'Ambos'}
                            </Text>
                        </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.footer}>
          <Button
            title={loading ? "Salvando..." : "Salvar Configurações"}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={{ backgroundColor: theme.gold, marginBottom: 16 }}
            textStyle={{ color: theme.primary, fontWeight: '900' }}
          />
          
          <Button
            title="Testar Notificações"
            onPress={async () => {
              try {
                await notificationService.testNotifications();
                Alert.alert('Sucesso', 'Notificação de teste enviada!');
              } catch (error) {
                Alert.alert('Erro', 'Não foi possível enviar notificação de teste');
              }
            }}
            variant="outline"
            style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent', marginBottom: 16 }}
            textStyle={{ color: theme.textPrimary, fontWeight: '700' }}
          />
          
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 15 }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.primary },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: theme.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.textPrimary },
  headerSubtitle: { fontSize: 13, color: theme.goldLight, marginTop: 2 },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 8,
    fontWeight: '500'
  },

  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)'
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 2
  },
  itemDesc: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  
  // Contador de Horas
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border
  },
  counterDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500'
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  counterBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
    minWidth: 30,
    textAlign: 'center'
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.border
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Dourado bem clarinho
    borderColor: theme.gold,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary
  },
  segmentTextActive: {
    color: theme.gold,
    fontWeight: '800'
  },

  footer: {
    marginTop: 10,
    marginBottom: 40
  }
});