import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Switch,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../contexts/AuthContext';
import { companyService } from '../../services/company';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AppNavigation } from '../../@types/navigation'; 

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
// ⚠️ ATENÇÃO: SUBSTITUA O 'X' PELO SEU IP
// ==============================================================================
const API_URL = "https://kairon-api.onrender.com"; 

interface BusinessHours {
  monday: { open: string; close: string };
  tuesday: { open: string; close: string };
  wednesday: { open: string; close: string };
  thursday: { open: string; close: string };
  friday: { open: string; close: string };
  saturday: { open: string; close: string };
  sunday: { open: string; close: string };
}

interface CompanySettings {
  onlineBooking: boolean;
  requireConfirmation: boolean;
  allowCancellations: boolean;
  cancellationNoticeHours: number;
  sendReminders: boolean;
  reminderHours: number;
}

interface CompanySettingsForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website?: string;
  description?: string;
  businessHours: BusinessHours;
  settings: CompanySettings;
  logo?: string | null;
}

export function CompanySettings() {
  const navigation = useNavigation<AppNavigation>(); 
  const { company, user, signOut } = useAuth() as any; 

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [logoVersion, setLogoVersion] = useState(Date.now());
  
  const targetCompanyId = company?.id || user?.companyId;
  const isOwner = user?.role === 'OWNER';

  const [form, setForm] = useState<CompanySettingsForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    description: '',
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '14:00' },
      sunday: { open: '', close: '' },
    },
    settings: {
      onlineBooking: true,
      requireConfirmation: false,
      allowCancellations: true,
      cancellationNoticeHours: 24,
      sendReminders: true,
      reminderHours: 24,
    },
  });

  const days = [
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ] as const;

  useEffect(() => {
    if (targetCompanyId) {
      loadCompanyData(targetCompanyId);
    } else {
      setLoading(false);
    }
  }, [targetCompanyId]);

  const loadCompanyData = async (id: string) => {
    try {
      setLoading(true);
      const data = await companyService.getSettings(id);

      setForm(prev => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        website: data.website || '',
        description: data.description || '',
        logo: data.logoUrl || null, 
        businessHours: data.businessHours || prev.businessHours,
        settings: data.settings || prev.settings,
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar empresa:', error);
      Alert.alert('Erro', 'Não foi possível carregar as configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isOwner) return;
    if (!targetCompanyId) return;

    setSaving(true);
    try {
      const updatedData = await companyService.updateSettings(targetCompanyId, form);
      
      setForm(prev => ({
         ...prev,
         ...updatedData, 
         logo: updatedData.logoUrl || prev.logo,
         businessHours: updatedData.businessHours || prev.businessHours
      }));

      Alert.alert('Sucesso', 'Configurações salvas!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const pickLogo = async () => {
    if (!isOwner) {
        Alert.alert('Acesso Restrito', 'Apenas o proprietário pode alterar o logo.');
        return;
    }
    if (!targetCompanyId) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
          Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
          return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setUploadingLogo(true);
        const formData = new FormData();
        
        formData.append('logo', {
          uri: result.assets[0].uri,
          type: 'image/jpeg', 
          name: 'logo.jpg',
        } as any);

        const updatedData = await companyService.uploadLogo(targetCompanyId, formData);
        
        setForm(prev => ({ 
            ...prev, 
            logo: updatedData.logoUrl 
        }));
        
        setLogoVersion(Date.now());
        Alert.alert('Sucesso', 'Logo atualizado!');
      }
    } catch (error: any) {
      console.error("Erro upload logo:", error);
      Alert.alert('Erro', 'Falha ao enviar logo. Verifique se o tamanho é menor que 10MB.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const updateField = (field: keyof CompanySettingsForm, value: string) => {
    if (isOwner) setForm(prev => ({ ...prev, [field]: value }));
  };

  // 👇 FIX: Tipagem rigorosa para aceitar apenas os dias válidos do BusinessHours
  const updateBusinessHours = (day: keyof BusinessHours, field: 'open' | 'close', value: string) => {
    if (!isOwner) return;
    setForm(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours[day], [field]: value },
      },
    }));
  };

  const updateSetting = (field: keyof CompanySettings, value: boolean | number) => {
    if (isOwner) setForm(prev => ({
        ...prev,
        settings: { ...prev.settings, [field]: value },
    }));
  };

  const handleSignOut = () => {
      Alert.alert('Sair', 'Deseja realmente sair?', [
        {text: 'Não', style: 'cancel'}, 
        {text: 'Sim', onPress: signOut, style: 'destructive'}
      ]);
  };

  // 👇 FIX: Retornar undefined (e não null) evita os erros no componente <Image>
  const getLogoSource = () => {
      if (!form.logo) return undefined;
      if (form.logo.startsWith('file://')) return { uri: form.logo };
      if (form.logo.startsWith('http')) return { uri: form.logo };

      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const path = form.logo.startsWith('/') ? form.logo : `/${form.logo}`;
      const fullUrl = `${baseUrl}${path}?t=${logoVersion}`; 
      
      return { uri: fullUrl };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  const logoSource = getLogoSource();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.headerTitleContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                  <Feather name="arrow-left" size={24} color={theme.gold} />
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Configurações</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* LOGO SECTION */}
            <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.logoContainer} 
                onPress={pickLogo}
                disabled={uploadingLogo || !isOwner}
                activeOpacity={0.8}
              >
                {logoSource ? (
                  <Image 
                    source={logoSource} 
                    style={styles.logo} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Feather name="briefcase" size={40} color={theme.gold} />
                  </View>
                )}
                
                {isOwner && (
                    <View style={styles.cameraBadge}>
                    {uploadingLogo ? <ActivityIndicator size="small" color={theme.primary} /> : <Feather name="camera" size={14} color={theme.primary} />}
                    </View>
                )}
              </TouchableOpacity>
              
              <Text style={styles.companyNameTitle}>{form.name || 'Nome da Empresa'}</Text>
              {!isOwner && <Text style={{color: theme.goldLight, fontSize: 13, fontWeight: '600'}}>Modo Visualização</Text>}
            </View>

            {/* DADOS GERAIS */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="info" size={18} color={theme.gold} />
                <Text style={styles.cardTitle}>Dados da Empresa</Text>
              </View>
              <View style={styles.inputGroup}>
                <Input label="Nome Fantasia" value={form.name} onChangeText={(v) => updateField('name', v)} editable={isOwner} />
                <Input label="E-mail" value={form.email} onChangeText={(v) => updateField('email', v)} editable={isOwner} keyboardType="email-address" />
                <Input label="Telefone" value={form.phone} onChangeText={(v) => updateField('phone', v)} editable={isOwner} keyboardType="phone-pad" />
                <Input label="Endereço" value={form.address} onChangeText={(v) => updateField('address', v)} editable={isOwner} />
                <Input label="Descrição" value={form.description || ''} onChangeText={(v) => updateField('description', v)} multiline editable={isOwner} />
              </View>
            </View>

            {/* WHATSAPP */}
            {isOwner && (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Feather name="message-circle" size={18} color={theme.gold} />
                        <Text style={styles.cardTitle}>Comunicação</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.menuButton}
                        onPress={() => navigation.navigate('WhatsAppSettings')}
                        activeOpacity={0.8}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuTitle}>Mensagem de Confirmação</Text>
                            <Text style={styles.menuSubtitle}>Edite o texto enviado no WhatsApp</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.gold} />
                    </TouchableOpacity>
                </View>
            )}

            {/* HORÁRIOS */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="clock" size={18} color={theme.gold} />
                <Text style={styles.cardTitle}>Horário de Funcionamento</Text>
              </View>
              <View style={styles.hoursList}>
                {days.map(day => {
                  const dayKey = day.key as keyof BusinessHours; // Tipagem forçada para o map do TS
                  return (
                    <View key={dayKey} style={styles.dayRow}>
                      <Text style={styles.dayLabel}>{day.label}</Text>
                      <View style={styles.timeInputs}>
                        <Input
                          value={form.businessHours[dayKey]?.open}
                          onChangeText={(v) => updateBusinessHours(dayKey, 'open', v)}
                          placeholder="00:00" 
                          style={styles.timeInput}
                          editable={isOwner}
                          keyboardType="numbers-and-punctuation"
                        />
                        <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>-</Text>
                        <Input
                          value={form.businessHours[dayKey]?.close}
                          onChangeText={(v) => updateBusinessHours(dayKey, 'close', v)}
                          placeholder="00:00" 
                          style={styles.timeInput}
                          editable={isOwner}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* REGRAS */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="sliders" size={18} color={theme.gold} />
                <Text style={styles.cardTitle}>Regras</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingText}>Aceitar agendamento online</Text>
                <Switch 
                  value={form.settings.onlineBooking} 
                  onValueChange={(v) => updateSetting('onlineBooking', v)}
                  disabled={!isOwner}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              </View>
            </View>

            {/* BOTÕES FINAIS */}
            <View style={styles.footerActions}>
              {isOwner && (
                  <Button 
                    title={saving ? "Salvando..." : "Salvar Alterações"} 
                    onPress={handleSubmit} 
                    loading={saving} 
                    style={{ backgroundColor: theme.gold }}
                    textStyle={{ color: theme.primary, fontWeight: '900' }}
                  />
              )}
              <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.8}>
                <Feather name="log-out" size={18} color={theme.danger} />
                <Text style={styles.logoutText}>Sair da Conta</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.versionInfo}>App Kairon Premium v1.0.0</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.primary },
  
  headerTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
      paddingBottom: 10
  },
  screenTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.textPrimary
  },
  
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  
  profileSection: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  logoContainer: { position: 'relative', marginBottom: 16 },
  logo: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: theme.gold, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  logoPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.gold },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.gold, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.primary },
  companyNameTitle: { fontSize: 24, fontWeight: '800', color: theme.textPrimary, marginBottom: 4, textAlign: 'center' },
  
  card: { backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 },
  inputGroup: { gap: 12 },
  
  hoursList: { gap: 16 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontSize: 14, color: theme.textSecondary, width: 80, fontWeight: '700' },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeInput: { width: 90, textAlign: 'center', height: 44 },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingText: { fontSize: 15, color: theme.textPrimary, flex: 1, fontWeight: '600' },
  
  footerActions: { gap: 16, marginTop: 16 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  logoutText: { marginLeft: 10, color: theme.danger, fontWeight: '800', fontSize: 15 },
  versionInfo: { textAlign: 'center', color: theme.textSecondary, fontSize: 12, marginTop: 32, fontWeight: '600' },
  
  menuButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border
  },
  menuTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 2
  },
  menuSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500'
  }
});