import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { Input } from '../../components/ui/Input';

interface RouteParams {
  token: string;
}

// Tema Kairon Premium
const THEME = {
  primary: '#0F172A',
  surface: '#1E293B',
  gold: '#D4AF37',
  goldLight: 'rgba(212, 175, 55, 0.1)',
  textLight: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.7)',
  border: 'rgba(212, 175, 55, 0.3)',
};

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
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Botão de Voltar */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons
              name="arrow-back"
              size={28}
              color={THEME.gold}
            />
          </TouchableOpacity>

          {/* HEADER / LOGO AREA */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock-reset" size={40} color={THEME.gold} />
            </View>
            <Text style={styles.title}>Nova Senha</Text>
            <Text style={styles.subtitle}>
              Digite sua nova senha abaixo
            </Text>
          </View>

          {/* FORMULÁRIO */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
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
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Confirmar Senha"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setError('');
                }}
                placeholder="Digite a senha novamente"
                secureTextEntry
              />
            </View>

            {error && !error.includes('senha') && (
              <Text style={styles.errorMessage}>{error}</Text>
            )}

            {/* Botão Dourado Principal */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={THEME.primary} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Alterar Senha
                </Text>
              )}
            </TouchableOpacity>

            {/* Botão Cancelar (Outline) */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center'
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
    marginBottom: 16,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: THEME.gold,
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textMuted,
    textAlign: 'center'
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16
  },
  errorMessage: {
    color: '#EF4444', // Vermelho para erros graves
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center'
  },
  primaryButton: {
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
    marginTop: 24,
  },
  primaryButtonText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: THEME.gold,
    marginTop: 16,
  },
  secondaryButtonText: {
    color: THEME.gold,
    fontSize: 16,
    fontWeight: 'bold',
  }
});