import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';

export function SignUp() {
  const navigation = useNavigation();
  const { signUp } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    businessType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cores do tema Premium Kairon
  const THEME = {
    primary: '#0F172A', // Azul Marinho do fundo
    surface: '#1E293B', // Azul mais claro para fundos de destaque
    gold: '#D4AF37',    // Dourado
    goldLight: 'rgba(212, 175, 55, 0.1)', // Dourado transparente
    textLight: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(212, 175, 55, 0.3)',
  };

  const businessTypes = [
    'Barbearia',
    'Salão de Beleza',
    'Estética',
    'Lash Design',
    'Manicure',
    'Personal Trainer',
    'Massagem',
    'Outro',
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!form.email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = 'Email inválido';

    if (!form.password.trim())
      newErrors.password = 'Senha é obrigatória';
    else if (form.password.length < 6)
      newErrors.password = 'Mínimo 6 caracteres';

    if (!form.confirmPassword.trim())
      newErrors.confirmPassword = 'Confirme sua senha';
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Senhas não conferem';

    if (!form.companyName.trim())
      newErrors.companyName = 'Nome da empresa é obrigatório';
    if (!form.businessType.trim())
      newErrors.businessType = 'Tipo de negócio é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        companyName: form.companyName,
        businessType: form.businessType,
      });
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || 'Erro ao criar conta'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[commonStyles.container, { backgroundColor: THEME.primary }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar backgroundColor={THEME.primary} barStyle="light-content" />
      
      <View style={[commonStyles.screenContainer, commonStyles.p4]}>
        {/* Botão de Voltar */}
        <TouchableOpacity
          style={[commonStyles.mb4, { alignSelf: 'flex-start', padding: 8, marginLeft: -8 }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={28}
            color={THEME.gold}
          />
        </TouchableOpacity>

        {/* Cabeçalho */}
        <View style={commonStyles.mb6}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: THEME.goldLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: THEME.border,
              }}
            >
              <MaterialIcons
                name="person-add"
                size={40}
                color={THEME.gold}
              />
            </View>

            <Text style={[commonStyles.h2, { color: THEME.gold }]}>Criar Conta</Text>
            <Text
              style={[
                commonStyles.bodySecondary,
                commonStyles.mt2,
                { color: THEME.textMuted }
              ]}
            >
              Comece a gerenciar seus agendamentos
            </Text>
          </View>
        </View>

        {/* Informações Pessoais */}
        <View style={commonStyles.mb6}>
          <Text style={[commonStyles.h3, commonStyles.mb4, { color: THEME.gold }]}>
            Informações Pessoais
          </Text>
          
          <Input
            label="Nome Completo *"
            placeholder="Seu nome"
            value={form.name}
            onChangeText={(text) => {
              setForm({ ...form, name: text });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
            editable={!loading}
          />

          <Input
            label="Email *"
            placeholder="seu@email.com"
            value={form.email}
            onChangeText={(text) => {
              setForm({ ...form, email: text });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            editable={!loading}
          />

          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Segurança */}
        <View style={commonStyles.mb6}>
          <Text style={[commonStyles.h3, commonStyles.mb4, { color: THEME.gold }]}>
            Segurança
          </Text>
          
          <Input
            label="Senha *"
            placeholder="••••••"
            value={form.password}
            onChangeText={(text) => {
              setForm({ ...form, password: text });
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            secureTextEntry
            error={errors.password}
            editable={!loading}
          />

          <Input
            label="Confirmar Senha *"
            placeholder="••••••"
            value={form.confirmPassword}
            onChangeText={(text) => {
              setForm({ ...form, confirmPassword: text });
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            secureTextEntry
            error={errors.confirmPassword}
            editable={!loading}
          />
        </View>

        {/* Informações da Empresa */}
        <View style={commonStyles.mb6}>
          <Text style={[commonStyles.h3, commonStyles.mb4, { color: THEME.gold }]}>
            Informações da Empresa
          </Text>
          
          <Input
            label="Nome da Empresa *"
            placeholder="Ex: Barbearia do João"
            value={form.companyName}
            onChangeText={(text) => {
              setForm({ ...form, companyName: text });
              if (errors.companyName) setErrors({ ...errors, companyName: '' });
            }}
            error={errors.companyName}
            editable={!loading}
          />

          <View style={commonStyles.mb4}>
            <Text style={[commonStyles.inputLabel, { color: THEME.textLight }]}>
              Tipo de Negócio *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {businessTypes.map((type) => {
                const isSelected = form.businessType === type;
                
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      {
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: THEME.border,
                        backgroundColor: 'transparent',
                      },
                      isSelected && {
                        backgroundColor: THEME.gold,
                        borderColor: THEME.gold,
                      },
                    ]}
                    onPress={() => {
                      setForm({ ...form, businessType: type });
                      if (errors.businessType) setErrors({ ...errors, businessType: '' });
                    }}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        commonStyles.caption,
                        { color: isSelected ? THEME.primary : THEME.textMuted },
                        isSelected && { fontWeight: 'bold' },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.businessType && (
              <Text style={[commonStyles.errorText, { marginTop: 8 }]}>{errors.businessType}</Text>
            )}
          </View>
        </View>

        {/* Botão de Submit Dourado */}
        <TouchableOpacity
          style={{
            backgroundColor: THEME.gold,
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            shadowColor: THEME.gold,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            marginBottom: 24,
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={THEME.primary} size="small" />
          ) : (
            <Text style={{ color: THEME.primary, fontSize: 16, fontWeight: 'bold' }}>
              Criar Conta
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={[commonStyles.rowCenter, commonStyles.mb4]}>
          <Text style={[commonStyles.bodySmall, { color: THEME.textMuted }]}>
            Já tem uma conta?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn' as never)}
            disabled={loading}
          >
            <Text
              style={[
                commonStyles.bodySmall,
                { color: THEME.gold, fontWeight: 'bold', fontSize: 15 },
              ]}
            >
              Entrar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 24 }}>
          <Text style={[commonStyles.caption, { color: THEME.textMuted, textAlign: 'center' }]}>
            Ao criar uma conta, você concorda com nossos Termos de Uso
          </Text>
          <Text style={[commonStyles.caption, { color: THEME.textMuted, textAlign: 'center', marginTop: 4 }]}>
            e Política de Privacidade
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}