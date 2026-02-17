import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
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
      style={commonStyles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[commonStyles.screenContainer, commonStyles.p4]}>
        <TouchableOpacity
          style={[commonStyles.mb4, { alignSelf: 'flex-start' }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={commonStyles.mb6}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <MaterialIcons
                name="person-add"
                size={40}
                color={colors.primary}
              />
            </View>

            <Text style={commonStyles.h2}>Criar Conta</Text>
            <Text
              style={[
                commonStyles.bodySecondary,
                commonStyles.mt2,
              ]}
            >
              Comece a gerenciar seus agendamentos
            </Text>
          </View>
        </View>

        <View style={commonStyles.mb6}>
          <Text style={[commonStyles.h3, commonStyles.mb4]}>Informações Pessoais</Text>
          
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

        <View style={commonStyles.mb6}>
          <Text style={[commonStyles.h3, commonStyles.mb4]}>Segurança</Text>
          
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

        <View style={commonStyles.mb6}>
          <Text style={[commonStyles.h3, commonStyles.mb4]}>Informações da Empresa</Text>
          
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
            <Text style={commonStyles.inputLabel}>Tipo de Negócio *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {businessTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                    form.businessType === type && {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
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
                      form.businessType === type && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.businessType && (
              <Text style={commonStyles.errorText}>{errors.businessType}</Text>
            )}
          </View>
        </View>

        <Button
          title="Criar Conta"
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
          style={commonStyles.mb4}
        />

        <View style={[commonStyles.rowCenter, commonStyles.mb4]}>
          <Text style={[commonStyles.bodySmall, { color: colors.textSecondary }]}>
            Já tem uma conta?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn' as never)}
            disabled={loading}
          >
            <Text
              style={[
                commonStyles.bodySmall,
                { color: colors.primary, fontWeight: '600' },
              ]}
            >
              Entrar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 24 }}>
          <Text style={[commonStyles.caption, { color: colors.textMuted, textAlign: 'center' }]}>
            Ao criar uma conta, você concorda com nossos Termos de Uso
          </Text>
          <Text style={[commonStyles.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 4 }]}>
            e Política de Privacidade
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}