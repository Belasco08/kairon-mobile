import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';
import { authStyles } from '../../styles/screens/auth';

export function ForgotPassword() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Digite seu e-mail');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('E-mail inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.forgotPassword({ email });
      
      Alert.alert(
        'E-mail enviado',
        'Verifique sua caixa de entrada para as instruções de redefinição de senha.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error sending reset password email:', err);
      setError(err.response?.data?.message || 'Não foi possível enviar o e-mail de recuperação');
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
            <Text style={authStyles.title}>Recuperar Senha</Text>
            <Text style={authStyles.subtitle}>
              Digite seu e-mail para receber instruções de redefinição de senha
            </Text>
          </View>

          <View style={authStyles.form}>
            <Card>
              <Input
                label="E-mail"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                }}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
                autoFocus
              />
            </Card>

            {error && (
              <Text style={authStyles.errorMessage}>{error}</Text>
            )}

            <Button
              title={loading ? "Enviando..." : "Enviar Instruções"}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 24 }}
            />

            <Button
              title="Voltar para Login"
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