import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authService } from '../../services/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';
import { authStyles } from '../../styles/screens/auth';

interface RouteParams {
  token: string;
}

export function ResetPassword() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = route.params as RouteParams;
  
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Digite a nova senha');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword({ token, password });
      
      Alert.alert(
        'Senha alterada',
        'Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn' as never),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.message || 'Não foi possível redefinir a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={authStyles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={authStyles.background}>
        <View style={authStyles.content}>
          <View style={authStyles.header}>
            <View style={authStyles.logoContainer}>
              <Text style={[commonStyles.h1, { color: colors.primary }]}>K</Text>
            </View>
            <Text style={authStyles.title}>Nova Senha</Text>
            <Text style={authStyles.subtitle}>
              Digite sua nova senha
            </Text>
          </View>

          <View style={authStyles.form}>
            <Card>
              <Input
                label="Nova Senha"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError('');
                }}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                error={error.includes('senha') ? error : ''}
              />

              <Input
                label="Confirmar Senha"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setError('');
                }}
                placeholder="Digite a senha novamente"
                secureTextEntry
                style={{ marginTop: 16 }}
              />
            </Card>

            {error && !error.includes('senha') && (
              <Text style={authStyles.errorMessage}>{error}</Text>
            )}

            <Button
              title={loading ? "Alterando..." : "Alterar Senha"}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 24 }}
            />

            <Button
              title="Cancelar"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}