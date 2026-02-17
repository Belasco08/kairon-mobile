import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
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
   TIPOS
========================= */

interface ProfessionalForm {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  password: string;
  confirmPassword: string;
  isActive: boolean;
  canBookOnline: boolean;
  commissionPercentage: string;
}

type RootStackParamList = {
  CreateProfessional: undefined;
};

/* =========================
   COMPONENT
========================= */

export function CreateProfessional() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false); 

  const [form, setForm] = useState<ProfessionalForm>({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    password: '',
    confirmPassword: '',
    isActive: true,
    canBookOnline: true,
    commissionPercentage: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfessionalForm, string>>>({});

  /* =========================
        VALIDAÇÃO
  ========================= */

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfessionalForm, string>> = {};

    if (!form.name?.trim()) newErrors.name = 'Nome é obrigatório';
    
    if (!form.email?.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!form.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (form.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não conferem';
    }

    if (form.commissionPercentage) {
        const cleanValue = form.commissionPercentage.replace(',', '.');
        const comm = parseFloat(cleanValue);
        if (isNaN(comm) || comm < 0 || comm > 100) {
            newErrors.commissionPercentage = 'Valor inválido (0-100)';
        }
    }

    setErrors(newErrors);
    
    // 👇 Fim do erro silencioso!
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

    // @ts-ignore
    const targetCompanyId = user?.companyId || user?.company?.id;

    if (!targetCompanyId) {
        Alert.alert("Erro", "Empresa não identificada. Faça login novamente.");
        return;
    }

    setLoading(true);
    try {
      const professionalData = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || undefined,
        specialty: form.specialty?.trim() || undefined,
        password: form.password,
        isActive: form.isActive,
        canBookOnline: form.canBookOnline,
        companyId: targetCompanyId,
        commissionPercentage: form.commissionPercentage 
            ? parseFloat(form.commissionPercentage.replace(',', '.')) 
            : 0,
        role: isOwner ? 'OWNER' : 'PROFESSIONAL', 
      };

      await professionalService.create(professionalData);

      Alert.alert(
        'Sucesso', 
        isOwner ? 'Novo Sócio cadastrado!' : 'Colaborador cadastrado!', 
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      console.error('Error creating professional:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Não foi possível criar o profissional.';
      Alert.alert('Erro no Cadastro', msg);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof ProfessionalForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  /* =========================
        RENDER
  ========================= */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                <Feather name="arrow-left" size={24} color={theme.gold} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Novo Colaborador</Text>
            <View style={{ width: 32 }} />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // 👇 O pulo do gato para o botão funcionar!
        >
          
          <Text style={styles.description}>
            Preencha os dados abaixo para adicionar um membro à equipe ou um novo sócio.
          </Text>

          {/* DADOS PESSOAIS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Feather name="user" size={18} color={theme.gold} />
                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            </View>
            
            <View style={styles.card}>
                <Input
                    label="Nome Completo *"
                    value={form.name}
                    onChangeText={value => updateForm('name', value)}
                    placeholder="Ex: João Silva"
                    error={errors.name}
                />

                <View>
                    <Input
                        label="E-mail de Login *"
                        value={form.email}
                        onChangeText={value => updateForm('email', value)}
                        placeholder="email@exemplo.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />
                    <Text style={styles.inputDescription}>Será usado para o colaborador acessar o sistema.</Text>
                </View>

                <Input
                    label="Telefone / WhatsApp"
                    value={form.phone}
                    onChangeText={value => updateForm('phone', value)}
                    placeholder="(00) 00000-0000"
                    keyboardType="phone-pad"
                />
            </View>
          </View>

          {/* DADOS PROFISSIONAIS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Feather name="briefcase" size={18} color={theme.gold} />
                <Text style={styles.sectionTitle}>Profissional</Text>
            </View>
            
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                        <Input
                            label="Especialidade"
                            value={form.specialty}
                            onChangeText={value => updateForm('specialty', value)}
                            placeholder="Ex: Barbeiro"
                        />
                    </View>
                    <View style={{ width: 100 }}>
                        <Input
                            label="Comissão %"
                            value={form.commissionPercentage}
                            onChangeText={value => updateForm('commissionPercentage', value)}
                            placeholder="0"
                            keyboardType="decimal-pad"
                            error={errors.commissionPercentage}
                            maxLength={5}
                        />
                    </View>
                </View>
            </View>
          </View>

          {/* PERMISSÕES (CARD ESPECIAL) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Feather name="shield" size={18} color={theme.gold} />
                <Text style={styles.sectionTitle}>Acesso e Permissões</Text>
            </View>
            
            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                
                {/* TOGGLE SÓCIO (OWNER) - DESTAQUE EM DOURADO */}
                <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => setIsOwner(!isOwner)}
                    style={[
                        styles.ownerRow, 
                        isOwner && { backgroundColor: 'rgba(212, 175, 55, 0.1)' }
                    ]}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                        <View style={[styles.iconBox, isOwner ? { backgroundColor: theme.gold } : { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                            <Feather name="key" size={20} color={isOwner ? theme.primary : theme.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.switchTitle, isOwner && { color: theme.gold }]}>
                                Nível Sócio / Administrador
                            </Text>
                            <Text style={styles.switchDesc}>
                                {isOwner 
                                    ? "Atenção: Acesso total ao financeiro e configurações." 
                                    : "Acesso padrão: Apenas agenda e histórico próprio."}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={isOwner}
                        onValueChange={setIsOwner}
                        trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
                        thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                    />
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* TOGGLES PADRÃO */}
                <View style={styles.togglesContainer}>
                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchTitleSmall}>Cadastro Ativo</Text>
                            <Text style={styles.switchDesc}>Pode acessar o sistema</Text>
                        </View>
                        <Switch
                            value={form.isActive}
                            onValueChange={v => updateForm('isActive', v)}
                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.success }}
                            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                        />
                    </View>

                    <View style={styles.dividerInternal} />

                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchTitleSmall}>Agendamento Online</Text>
                            <Text style={styles.switchDesc}>Visível no App do cliente</Text>
                        </View>
                        <Switch
                            value={form.canBookOnline}
                            onValueChange={v => updateForm('canBookOnline', v)}
                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.gold }}
                            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                        />
                    </View>
                </View>
            </View>
          </View>

          {/* SEGURANÇA */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Feather name="lock" size={18} color={theme.gold} />
                <Text style={styles.sectionTitle}>Senha de Acesso</Text>
            </View>
            
            <View style={styles.card}>
                <Input
                    label="Senha Provisória *"
                    value={form.password}
                    onChangeText={value => updateForm('password', value)}
                    placeholder="Mínimo 6 caracteres"
                    secureTextEntry
                    error={errors.password}
                />

                <Input
                    label="Confirmar Senha *"
                    value={form.confirmPassword}
                    onChangeText={value => updateForm('confirmPassword', value)}
                    placeholder="Repita a senha"
                    secureTextEntry
                    error={errors.confirmPassword}
                />
            </View>
          </View>

          {/* 👇 Botão agora no Tema Gold */}
          <Button
            title={loading ? "Cadastrando..." : "Finalizar Cadastro"}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={{ backgroundColor: theme.gold, marginTop: 10, marginBottom: 30 }}
            textStyle={{ color: theme.primary, fontWeight: '900' }}
          />

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
        fontWeight: '800',
        color: theme.textPrimary
    },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    description: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 24,
        lineHeight: 20
    },
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
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        borderWidth: 1,
        borderColor: theme.border
    },
    inputDescription: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 4,
        marginLeft: 4
    },
    
    // Estilos Especiais para Permissões
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: theme.cardBg
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    switchTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.textPrimary,
        marginBottom: 4
    },
    switchTitleSmall: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.textPrimary
    },
    switchDesc: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 2
    },
    
    togglesContainer: {
        padding: 20,
        backgroundColor: theme.cardBg
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    divider: {
        height: 1,
        backgroundColor: theme.border
    },
    dividerInternal: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 16
    }
});