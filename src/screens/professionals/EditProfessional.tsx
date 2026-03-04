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
  TouchableOpacity,
  Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'; 

import { useAuth } from '../../contexts/AuthContext';
import { professionalService } from '../../services/professionals';
import { api } from '../../services/api'; // 👈 Importado para as rotas financeiras
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

  // 👇 ESTADOS DO ACERTO DE CONTAS
  const [settlement, setSettlement] = useState<any>(null);
  const [loadingSettlement, setLoadingSettlement] = useState(false);

  // 👇 ESTADOS DO MODAL DE VALE
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDesc, setAdvanceDesc] = useState('');
  const [savingAdvance, setSavingAdvance] = useState(false);

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
        if (user?.role === 'OWNER') {
           loadSettlement();
        }
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

  const loadSettlement = async () => {
    try {
      setLoadingSettlement(true);
      const response = await api.get(`/financial/settlement/${professionalId}`);
      setSettlement(response.data);
    } catch (error) {
      console.log("Erro ao carregar acerto:", error);
    } finally {
      setLoadingSettlement(false);
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
    
    if (Object.keys(newErrors).length > 0) {
        Alert.alert("Atenção", "Verifique os campos obrigatórios antes de salvar.");
        return false;
    }
    
    return true;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // 👇 FUNÇÃO PARA LANÇAR O VALE
  const handleSaveAdvance = async () => {
    if (!advanceAmount) {
      Alert.alert("Atenção", "Digite um valor para o vale.");
      return;
    }

    const cleanAmount = Number(advanceAmount.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert("Atenção", "Valor inválido.");
      return;
    }

    try {
      setSavingAdvance(true);
      // Chama a nova rota que criamos no Java
      await api.post(`/financial/settlement/${professionalId}/advance?amount=${cleanAmount}&description=${encodeURIComponent(advanceDesc)}`);
      
      Alert.alert("Sucesso", "Vale registrado com sucesso!");
      setShowAdvanceModal(false);
      setAdvanceAmount('');
      setAdvanceDesc('');
      
      // Recarrega o acerto de contas para a matemática atualizar na hora!
      loadSettlement(); 
    } catch (error) {
      Alert.alert("Erro", "Não foi possível lançar o vale.");
    } finally {
      setSavingAdvance(false);
    }
  };

  // 👇 FUNÇÃO PARA PAGAR E ENVIAR WHATSAPP
  const handlePaySettlement = () => {
    if (!settlement || settlement.netPayout <= 0) {
        Alert.alert("Aviso", "Não há saldo pendente para pagar a este profissional.");
        return;
    }

    Alert.alert(
      "Confirmar Acerto",
      `Deseja quitar o valor de ${formatCurrency(settlement.netPayout)} e zerar as pendências de ${form.name.split(' ')[0]}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Pagar", 
          onPress: async () => {
            try {
              setSaving(true);
              await api.post(`/financial/settlement/${professionalId}/pay`);
              
              if (form.phone) {
                 const phone = form.phone.replace(/\D/g, "");
                 const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
                 
                 const msg = `Fala ${form.name.split(' ')[0]}, tudo bem?\n\nPassando para enviar o recibo do seu acerto semanal! ✂️\n\n💰 *Comissões:* ${formatCurrency(settlement.totalCommission)}\n📉 *Vales/Consumo:* - ${formatCurrency(settlement.totalAdvances)}\n✅ *Total Pago:* ${formatCurrency(settlement.netPayout)}\n\nO valor já foi transferido. Bom descanso e vamos pra cima! 🚀`;
                 
                 Linking.openURL(`whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`);
              }

              Alert.alert("Sucesso", "Acerto realizado e registrado no sistema!");
              loadSettlement(); 
            } catch (error) {
              Alert.alert("Erro", "Falha ao registrar o pagamento.");
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
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
              setSaving(true); 
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
            keyboardShouldPersistTaps="handled" 
        >
          
          {/* ========================================================= */}
          {/* 👇 ACERTO DE CONTAS (SÓ APARECE PARA O DONO) 👇 */}
          {/* ========================================================= */}
          {user?.role === 'OWNER' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="cash-register" size={18} color={theme.success} />
                  <Text style={[styles.sectionTitle, { color: theme.success }]}>Acerto de Contas</Text>
              </View>

              <View style={[styles.card, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                {loadingSettlement ? (
                   <ActivityIndicator size="small" color={theme.success} />
                ) : (
                   <View style={{ gap: 12 }}>
                      <View style={styles.settlementRow}>
                         <Text style={styles.settlementLabel}>Comissões a Receber</Text>
                         <Text style={[styles.settlementValue, { color: theme.goldLight }]}>
                            {formatCurrency(settlement?.totalCommission || 0)}
                         </Text>
                      </View>
                      <View style={styles.settlementRow}>
                         <Text style={styles.settlementLabel}>Vales / Consumo (Desconto)</Text>
                         <Text style={[styles.settlementValue, { color: theme.danger }]}>
                            - {formatCurrency(settlement?.totalAdvances || 0)}
                         </Text>
                      </View>
                      
                      <View style={styles.dividerInternal} />
                      
                      <View style={styles.settlementRow}>
                         <Text style={styles.settlementTotalLabel}>Total a Pagar</Text>
                         <Text style={styles.settlementTotalValue}>
                            {formatCurrency(settlement?.netPayout || 0)}
                         </Text>
                      </View>

                      {/* 👇 NOVO BOTÃO DE VALE 👇 */}
                      <TouchableOpacity 
                         style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 4, marginBottom: 8 }}
                         onPress={() => setShowAdvanceModal(true)}
                      >
                         <Feather name="minus-circle" size={16} color={theme.danger} style={{ marginRight: 6 }} />
                         <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 14 }}>Lançar Vale / Consumo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                         style={[
                           styles.payButton, 
                           (!settlement || settlement.netPayout <= 0) && { opacity: 0.5 }
                         ]}
                         onPress={handlePaySettlement}
                         disabled={!settlement || settlement.netPayout <= 0 || saving}
                      >
                         <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
                         <Text style={styles.payButtonText}>Pagar e Enviar Recibo</Text>
                      </TouchableOpacity>
                   </View>
                )}
              </View>
            </View>
          )}

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

      {/* 👇 MODAL DE VALE 👇 */}
      {showAdvanceModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20, zIndex: 999 }}>
          <View style={{ backgroundColor: theme.cardBg, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary, marginBottom: 16 }}>Lançar Vale / Consumo</Text>
            
            <View style={{ gap: 12 }}>
              <Input
                label="Valor (R$)"
                placeholder="Ex: 15,00"
                keyboardType="numeric"
                value={advanceAmount}
                onChangeText={setAdvanceAmount}
              />
              <Input
                label="Descrição (Opcional)"
                placeholder="Ex: Coca-cola, Adiantamento..."
                value={advanceDesc}
                onChangeText={setAdvanceDesc}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Button
                title="Cancelar"
                variant="outline"
                style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                textStyle={{ color: theme.textSecondary }}
                onPress={() => setShowAdvanceModal(false)}
                disabled={savingAdvance}
              />
              <Button
                title={savingAdvance ? "Salvando..." : "Lançar"}
                style={{ flex: 1, backgroundColor: theme.danger }}
                textStyle={{ color: '#FFF' }}
                onPress={handleSaveAdvance}
                disabled={savingAdvance}
              />
            </View>
          </View>
        </View>
      )}
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
        marginVertical: 12
    },

    // 👇 ESTILOS DO ACERTO DE CONTAS
    settlementRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settlementLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    settlementValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    settlementTotalLabel: {
        fontSize: 16,
        color: theme.textPrimary,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    settlementTotalValue: {
        fontSize: 24,
        color: theme.success,
        fontWeight: '900',
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.success,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    payButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
    }
});