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
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { Input } from '../../components/ui/Input';

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
              <MaterialIcons name="email" size={40} color={THEME.gold} />
            </View>
            <Text style={styles.title}>Recuperar Senha</Text>
            <Text style={styles.subtitle}>
              Digite seu e-mail para receber instruções de redefinição de senha
            </Text>
          </View>

          {/* FORMULÁRIO */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
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
                editable={!loading}
              />
            </View>

            {error ? (
              <Text style={styles.errorMessage}>{error}</Text>
            ) : null}

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
                  Enviar Instruções
                </Text>
              )}
            </TouchableOpacity>

            {/* Botão Secundário (Outline) */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                Voltar para Login
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16
  },
  errorMessage: {
    color: '#EF4444', // Vermelho para mensagens de erro
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
    marginTop: 8,
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