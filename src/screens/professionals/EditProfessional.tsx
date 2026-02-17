import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; 

import { useAuth } from '../../contexts/AuthContext';
import { professionalService } from '../../services/professionals';
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
  border: 'rgba(255, 255, 255, 0.05)',
};

/* =========================
   TIPOS LOCAIS
========================= */

interface ProfessionalForm {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  isActive: boolean;
  canBookOnline: boolean;
  commissionPercentage: string; 
  password?: string;
  confirmPassword?: string;
}

interface RouteParams {
  professionalId: string;
}

/* =========================
   COMPONENT
========================= */

export function EditProfessional() {
  const navigation = useNavigation();
  const route = useRoute();
  const { professionalId } = route.params as RouteParams;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [form, setForm] = useState<ProfessionalForm>({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    isActive: true,
    canBookOnline: true,
    commissionPercentage: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfessionalForm, string>>>({});

  /* =========================
      LOAD DATA
  ========================= */

  useEffect(() => {
    if (professionalId) {
        loadProfessional();
    } else {
        Alert.alert("Erro", "ID do profissional não encontrado.");
        navigation.goBack();
    }
  }, [professionalId]);

  const loadProfessional = async () => {
    try {
      setLoading(true);
      const professional = await professionalService.get(professionalId);

      setForm({
        name: professional.name || '',
        email: professional.email || '',
        phone: professional.phone || '',
        specialty: professional.specialty || '',
        isActive: professional.isActive ?? true,
        canBookOnline: professional.canBookOnline ?? true,
        commissionPercentage: professional.commissionPercentage 
          ? String(professional.commissionPercentage).replace('.', ',') 
          : '',
      });
    } catch (error) {
      console.error('Error loading professional:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do profissional.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      HANDLERS
  ========================= */

  const updateForm = (field: keyof ProfessionalForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfessionalForm, string>> = {};

    // O "?" (Optional Chaining) evita o erro fantasma caso a string seja nula
    if (!form.name?.trim()) newErrors.name = 'Nome é obrigatório';
    
    if (!form.email?.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (isChangingPassword) {
      if (!form.password || form.password.length < 6) {
        newErrors.password = 'Mínimo de 6 caracteres';
      }
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'As senhas não coincidem';
      }
    }

    if (form.commissionPercentage) {
      const cleanValue = form.commissionPercentage.replace(',', '.');
      const comm = Number(cleanValue);
      
      if (isNaN(comm)) {
          newErrors.commissionPercentage = 'Valor inválido';
      } else if (comm < 0 || comm > 100) {
        newErrors.commissionPercentage = 'Deve ser entre 0 e 100';
      }
    }

    setErrors(newErrors);
    
    // Se tiver erro, avisa na hora na tela
    if (Object.keys(newErrors).length > 0) {
        Alert.alert("Atenção", "Verifique os campos obrigatórios antes de salvar.");
        return false;
    }
    
    return true;
  };

  /* =========================
      SUBMIT
  ========================= */

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const commissionValue = form.commissionPercentage
        ? Number(form.commissionPercentage.replace(',', '.'))
        : null;

      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || null,
        specialty: form.specialty?.trim() || null,
        isActive: form.isActive,
        canBookOnline: form.canBookOnline,
        commissionPercentage: commissionValue,
      };

      if (isChangingPassword && form.password) {
        payload.password = form.password;
      }

      await professionalService.update(professionalId, payload);

      Alert.alert('Sucesso', 'Profissional atualizado!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("❌ Erro no update:", error);
      Alert.alert(
        'Erro',
        error?.response?.data?.message || 'Falha ao atualizar profissional.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remover Profissional',
      'Tem certeza? Essa ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true); // Usando setSaving para desativar os botões enquanto exclui
              await professionalService.delete(professionalId);
              navigation.goBack();
            } catch (error) {
              setSaving(false);
              Alert.alert('Erro', 'Não foi possível excluir o profissional. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  /* =========================
      RENDER
  ========================= */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} 
      >
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                <Feather name="arrow-left" size={24} color={theme.gold} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Colaborador</Text>
            <View style={{ width: 32 }} />
        </View>

        <ScrollView 
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // 👇 ISSO AQUI RESOLVE O BOTÃO "TRAVADO"
        >
          
          {/* === DADOS PESSOAIS === */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Feather name="user" size={18} color={theme.gold} />
                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            </View>

            <View style={styles.card}>
              <View style={{ gap: 16 }}>
                <Input
                  label="Nome Completo *"
                  value={form.name}
                  onChangeText={(t) => updateForm('name', t)}
                  error={errors.name}
                />

                <Input
                  label="E-mail *"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(t) => updateForm('email', t)}
                  error={errors.email}
                />

                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(t) => updateForm('phone', t)}
                />

                <Input
                  label="Especialidade / Cargo"
                  placeholder="Ex: Barbeiro"
                  value={form.specialty}
                  onChangeText={(t) => updateForm('specialty', t)}
                />
              </View>
            </View>
          </View>

          {/* === SEGURANÇA (SENHA) === */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Feather name="lock" size={18} color={theme.gold} />
                <Text style={styles.sectionTitle}>Acesso</Text>
            </View>

            <View style={styles.card}>
                <View style={[styles.switchRow, { marginBottom: isChangingPassword ? 16 : 0 }]}>
                    <Text style={styles.switchLabel}>Alterar Senha de Acesso</Text>
                    <Switch 
                        value={isChangingPassword}
                        onValueChange={setIsChangingPassword}
                        trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
                        thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                    />
                </View>

                {isChangingPassword && (
                    <View style={{ gap: 16, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 }}>
                        <Input 
                            label="Nova Senha"
                            secureTextEntry
                            value={form.password || ''}
                            onChangeText={(t) => updateForm('password', t)}
                            error={errors.password}
                        />
                        <Input 
                            label="Confirmar Senha"
                            secureTextEntry
                            value={form.confirmPassword || ''}
                            onChangeText={(t) => updateForm('confirmPassword', t)}
                            error={errors.confirmPassword}
                        />
                    </View>
                )}
            </View>
          </View>

          {/* === CONFIGURAÇÕES === */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Feather name="settings" size={18} color={theme.gold} />
                <Text style={styles.sectionTitle}>Configurações</Text>
            </View>

            <View style={styles.card}>
              <View style={{ gap: 16 }}>
                
                <Input
                  label="Comissão (%)"
                  placeholder="Ex: 50"
                  keyboardType="numeric"
                  value={form.commissionPercentage}
                  onChangeText={(t) => updateForm('commissionPercentage', t)}
                  error={errors.commissionPercentage}
                  maxLength={5}
                />

                <View style={styles.dividerInternal} />

                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Profissional Ativo</Text>
                    <Text style={styles.switchDesc}>Aparece na lista interna</Text>
                  </View>
                  <Switch
                    value={form.isActive}
                    onValueChange={(v) => updateForm('isActive', v)}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.success }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>

                <View style={styles.dividerInternal} />

                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Agendamento Online</Text>
                    <Text style={styles.switchDesc}>Visível no app para clientes</Text>
                  </View>
                  <Switch
                    value={form.canBookOnline}
                    onValueChange={(v) => updateForm('canBookOnline', v)}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>

              </View>
            </View>
          </View>

          {/* === AÇÕES === */}
          <View style={{ gap: 14, marginTop: 10 }}>
            {/* 👇 Botão agora no Tema Gold */}
            <Button
              title={saving ? "Salvando..." : "Salvar Alterações"}
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
              style={{ backgroundColor: theme.gold }}
              textStyle={{ color: theme.primary, fontWeight: '900' }}
            />

            {user?.role === 'OWNER' && (
              <Button
                title="Excluir Profissional"
                variant="outline"
                style={{ borderColor: theme.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                textStyle={{ color: theme.danger, fontWeight: '700' }}
                onPress={handleDelete}
                disabled={saving}
              />
            )}
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
        fontWeight: '800',
        color: theme.textPrimary
    },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    
    section: { marginBottom: 28 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 8
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.gold,
        textTransform: 'uppercase',
        letterSpacing: 1.2
    },
    
    card: {
        backgroundColor: theme.cardBg,
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        borderWidth: 1,
        borderColor: theme.border
    },
    
    switchRow: {
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingVertical: 6
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.textPrimary,
        marginBottom: 4
    },
    switchDesc: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    dividerInternal: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 8
    }
});